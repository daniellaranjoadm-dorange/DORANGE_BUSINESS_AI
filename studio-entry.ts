import { configureStudioDemo } from './server/studio-demo.js';

configureStudioDemo();

await import('./server.js');