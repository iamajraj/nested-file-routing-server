import path from 'path';
import htmlParser from 'node-html-parser';
import { fileURLToPath, pathToFileURL } from 'url';
import { readFileSync, readdirSync } from 'fs';
import http from 'http';

class Route {
  urlPath;
  filePath;
  page;
  constructor(urlPath, filePath, page) {
    this.filePath = filePath;
    this.page = page;
    this.urlPath = urlPath;
  }
}

class Router {
  routes = [];

  push(urlPath, filePath, page) {
    const route = new Route(urlPath, filePath, page);
    this.routes.push(route);
  }
  getRoutes() {
    return this.routes;
  }
}

const router = new Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.join(__dirname, '..', process.argv[2]);

const parseRoutes = (
  currentDir = path.join(root, 'routes'),
  routeName = null
) => {
  const contents = readdirSync(currentDir, { withFileTypes: true });
  contents.forEach((file) => {
    const filePath = path.join(currentDir, file.name);
    if (file.isDirectory()) {
      parseRoutes(filePath, file.name);
    } else {
      const isRoot = path.basename(currentDir) === 'routes';
      const page = import(
        pathToFileURL(path.join(currentDir, file.name)).pathname
      );

      if (isRoot) {
        router.push('/', filePath, page);
      } else {
        const nestedRoute =
          '/' + currentDir.slice(currentDir.indexOf('routes\\') + 7);
        if (routeName) {
          router.push(nestedRoute, currentDir, page);
        }
      }
    }
  });
};

parseRoutes();
console.log(router.routes);

const rootHTMLPath = path.join(root, 'index.html');
const html = readFileSync(rootHTMLPath, { encoding: 'utf8' });

const dom = htmlParser.parse(html);
dom.getElementById('root').innerHTML = '<h1>Hello World</h1>';

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.end(dom.toString(), (err) => {
    if (err) {
      console.log(err);
    }
  });
});

server.listen(3000, () => {
  console.log('Listening on port :3000');
});
