import {FileError, createDir} from './t_utils';
import path from 'path';
import fs from 'fs';
import less from 'less';

export default async function compile_less(inp:string, outp:string):Promise<FileError|null> {
	return await (new Promise((resolve)=>{
		less.render(fs.readFileSync(inp,'utf-8'),
			{filename:inp},
			(e,out)=>{
				if (out) {
					createDir(path.resolve(outp,'..'));
					fs.writeFileSync(outp, out.css);
					resolve(null);
				} else {
					let erstring = 'Invalid file';
					if (e.line&&e.column&&e.message)
						erstring = `(${e.line},${e.column}): `+ e.message+'\n';
					resolve({
						file:inp,
						error:erstring,
					});
				}
			});
	}));
}