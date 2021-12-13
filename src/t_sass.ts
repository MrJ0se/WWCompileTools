import {FileError, createDir} from './t_utils';
import path from 'path';
import fs from 'fs';
import sass from 'sass';

export default async function compile_sass(inp:string, outp:string):Promise<FileError|null> {
	try {
		let r = sass.renderSync({file: inp});
		createDir(path.resolve(outp,'..'));
		fs.writeFileSync(outp, r.css);
	} catch(e:any) {
		let erstring = 'Invalid file';
		if (e.line&&e.column&&e.formatted) {
			erstring =
				`(${e.line},${e.column}): `+ 
				e.formatted.substring(0,e.formatted.indexOf('\n'))+'\n';
		}
		return {
			file:inp,
			error:erstring,
		};
	}
	return null;
}