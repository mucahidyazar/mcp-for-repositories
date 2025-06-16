// mcp-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import process from 'process';

interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

interface ProjectStructure {
  [key: string]: any;
}

interface ProjectInfo {
  name: string;
  type: string;
  version: string;
  description: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  structure: ProjectStructure;
  path: string;
  lastUpdated: string;
}

class ProjectDocumentationServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "project-docs-server",
        version: "1.0.0"
      },
      {
        capabilities: {
          resources: {},
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // Tools listesi
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "list_all_projects",
            description: "Yerel tüm projeleri listele ve analiz et",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "Taranacak ana dizin (varsayılan: REPOSITORIES_PATH)"
                }
              }
            }
          },
          {
            name: "analyze_project",
            description: "Belirli bir projeyi detaylı analiz et",
            inputSchema: {
              type: "object",
              properties: {
                projectPath: {
                  type: "string",
                  description: "Analiz edilecek proje dizini"
                }
              },
              required: ["projectPath"]
            }
          }
        ]
      };
    });

    // Tool çağrıları
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "list_all_projects":
            const repositoriesPath = (args?.path as string) || process.env.REPOSITORIES_PATH || '..';
            const projects = await this.scanAllRepositories(repositoriesPath);
            return {
              content: [
                {
                  type: "text",
                  text: `Toplam ${projects.length} proje bulundu:\n\n` +
                    projects.map(p => `📁 ${p.name} (${p.type}) - ${p.path}`).join('\n')
                }
              ]
            };

          case "analyze_project":
            if (!args?.projectPath) {
              throw new Error("projectPath parametresi gerekli");
            }
            const projectInfo = await this.analyzeProject(args.projectPath as string);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(projectInfo, null, 2)
                }
              ]
            };

          default:
            throw new Error(`Bilinmeyen tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Hata: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    });

    // Resources listesi
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: "project://all-repositories",
            name: "All Repositories",
            mimeType: "application/json",
            description: "Tüm yerel projelerin listesi"
          }
        ]
      };
    });

    // Resource okuma
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      if (uri === "project://all-repositories") {
        return await this.getAllRepositories();
      }

      throw new Error(`Bilinmeyen resource: ${uri}`);
    });
  }

  async getAllRepositories() {
    const repositoriesPath = process.env.REPOSITORIES_PATH || '..';
    const projects = await this.scanAllRepositories(repositoriesPath);
    return {
      contents: [{
        uri: "project://all-repositories",
        mimeType: "application/json",
        text: JSON.stringify(projects, null, 2)
      }]
    };
  }

  async scanAllRepositories(rootDir: string): Promise<ProjectInfo[]> {
    const projects: ProjectInfo[] = [];

    try {
      console.error(`Taranıyor: ${rootDir}`);
      const dirs = await fs.readdir(rootDir);

      for (const dir of dirs) {
        const projectPath = path.join(rootDir, dir);

        try {
          const stat = await fs.stat(projectPath);

          if (stat.isDirectory() && !dir.startsWith('.') && dir !== 'node_modules') {
            // Git repo kontrolü
            const gitPath = path.join(projectPath, '.git');
            const isGitRepo = await this.pathExists(gitPath);

            if (isGitRepo || await this.hasPackageJson(projectPath)) {
              console.error(`Proje analiz ediliyor: ${projectPath}`);
              const projectInfo = await this.analyzeProject(projectPath);
              projects.push(projectInfo);
            }
          }
        } catch (error) {
          console.error(`Proje analiz hatası ${projectPath}:`, error);
        }
      }
    } catch (error) {
      console.error(`Dizin tarama hatası ${rootDir}:`, error);
    }

    console.error(`Toplam ${projects.length} proje bulundu`);
    return projects;
  }

  async analyzeProject(projectPath: string): Promise<ProjectInfo> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    let packageJson: PackageJson = {};

    try {
      const packageContent = await fs.readFile(packageJsonPath, 'utf8');
      packageJson = JSON.parse(packageContent);
    } catch (error) {
      // package.json yoksa sorun değil
    }

    const projectType = await this.detectProjectType(projectPath, packageJson);
    const structure = await this.getProjectStructure(projectPath);

    return {
      name: packageJson.name || path.basename(projectPath),
      type: projectType,
      version: packageJson.version || '1.0.0',
      description: packageJson.description || '',
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
      scripts: packageJson.scripts || {},
      structure: structure,
      path: projectPath,
      lastUpdated: new Date().toISOString()
    };
  }

  async getProjectStructure(projectPath: string): Promise<ProjectStructure> {
    const structure: ProjectStructure = {};

    try {
      // Önemli dizinleri kontrol et
      const importantDirs = ['src', 'public', 'pages', 'components', 'lib', 'utils'];

      for (const dir of importantDirs) {
        const dirPath = path.join(projectPath, dir);
        if (await this.pathExists(dirPath)) {
          structure[dir] = await this.getDirectoryContents(dirPath, 1);
        }
      }

      // Önemli dosyaları kontrol et
      const configFiles = [
        'next.config.js', 'next.config.ts',
        'tailwind.config.js', 'tailwind.config.ts',
        'tsconfig.json', 'jsconfig.json',
        'webpack.config.js', 'vite.config.js',
        'README.md', '.env.example'
      ];

      for (const file of configFiles) {
        const filePath = path.join(projectPath, file);
        if (await this.pathExists(filePath)) {
          structure[file] = 'exists';
        }
      }

    } catch (error) {
      console.error(`Yapı analiz hatası ${projectPath}:`, error);
    }

    return structure;
  }

  async getDirectoryContents(dirPath: string, maxDepth: number = 2, currentDepth: number = 0): Promise<ProjectStructure> {
    if (currentDepth >= maxDepth) return {};

    const contents: ProjectStructure = {};

    try {
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules') continue;

        const itemPath = path.join(dirPath, item);
        const stat = await fs.stat(itemPath);

        if (stat.isDirectory()) {
          contents[item] = await this.getDirectoryContents(itemPath, maxDepth, currentDepth + 1);
        } else {
          contents[item] = 'file';
        }
      }
    } catch (error) {
      console.error(`Dizin okuma hatası ${dirPath}:`, error);
    }

    return contents;
  }

  async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async hasPackageJson(projectPath: string): Promise<boolean> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    return await this.pathExists(packageJsonPath);
  }

  async detectProjectType(projectPath: string, packageJson: PackageJson): Promise<string> {
    // Next.js kontrolü
    if (packageJson.dependencies?.['next'] || packageJson.devDependencies?.['next']) {
      return 'Next.js';
    }

    // React kontrolü
    if (packageJson.dependencies?.['react'] || packageJson.devDependencies?.['react']) {
      if (packageJson.dependencies?.['react-scripts'] || packageJson.devDependencies?.['react-scripts']) {
        return 'Create React App';
      }
      return 'React';
    }

    // Vue.js kontrolü
    if (packageJson.dependencies?.['vue'] || packageJson.devDependencies?.['vue']) {
      return 'Vue.js';
    }

    // Angular kontrolü
    if (packageJson.dependencies?.['@angular/core'] || packageJson.devDependencies?.['@angular/core']) {
      return 'Angular';
    }

    // Express.js kontrolü
    if (packageJson.dependencies?.['express'] || packageJson.devDependencies?.['express']) {
      return 'Express.js';
    }

    // Python kontrolü
    if (await this.pathExists(path.join(projectPath, 'requirements.txt')) ||
      await this.pathExists(path.join(projectPath, 'pyproject.toml')) ||
      await this.pathExists(path.join(projectPath, 'Pipfile'))) {
      return 'Python';
    }

    // Go kontrolü
    if (await this.pathExists(path.join(projectPath, 'go.mod'))) {
      return 'Go';
    }

    // Rust kontrolü
    if (await this.pathExists(path.join(projectPath, 'Cargo.toml'))) {
      return 'Rust';
    }

    // Git repo kontrolü
    if (await this.pathExists(path.join(projectPath, '.git'))) {
      return 'Git Repository';
    }

    return 'Unknown';
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error("Project Documentation MCP server running on stdio");
    } catch (error) {
      console.error("MCP server başlatma hatası:", error);
      process.exit(1);
    }
  }
}

const server = new ProjectDocumentationServer();
server.run().catch(console.error);