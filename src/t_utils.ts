import fs from 'fs';
import path from 'path';

export interface FileError {
	file:string,
	error:string,
};
export function createDir(p:string) {
	if (fs.existsSync(p) && fs.statSync(p).isDirectory())
		return;
	createDir(path.resolve(p, '..'));
	fs.mkdirSync(p);
}