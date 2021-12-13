import {FileError, createDir} from './t_utils';
import path from 'path';
import fs from 'fs';
import pug from 'pug';

export default async function compile_pug (inp:string, outp:string):Promise<FileError|null> {
	try {
		let compiled = pug.renderFile(inp);
		createDir(path.resolve(outp, '..'));
		fs.writeFileSync(outp, compiled);
	} catch(e) {
		return {
			file:inp,
			error:e+''
		};
	}
	return null;
}