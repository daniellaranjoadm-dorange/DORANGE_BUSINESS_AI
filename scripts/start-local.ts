import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
// Local runner always requires an explicit existing copy of the database.
if (!process.env.DATA_DIR || !path.isAbsolute(process.env.DATA_DIR)) {
 throw new Error('DATA_DIR deve indicar o caminho absoluto da cópia privada de homologação.');
}
if (!fs.existsSync(path.join(process.env.DATA_DIR, 'database.json'))) {
 throw new Error('Banco de homologação ausente. Restaure uma cópia; não execute setup:local.');
}
process.env.ALLOW_EMPTY_DB = 'false';
process.env.HOST = '127.0.0.1';
await import('../server.js');
// Keep the desktop shortcuts in sync even when started by a development session.
fs.mkdirSync(path.resolve('.local-run'),{recursive:true});
fs.writeFileSync(path.resolve('.local-run/server.pid'),String(process.pid));
