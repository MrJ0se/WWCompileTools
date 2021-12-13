import {FileError, createDir} from './t_utils';
import path from 'path';
import fs from 'fs';
import ejs from 'ejs';

export default async function compile_ejs (inp:string, outp:string):Promise<FileError|null> {
	return await (new Promise((resolve)=>{
		ejs.renderFile(inp, (err,str)=>{
			if (err) {
				resolve({
					file:inp,
					error:err+''
				});
				return;
			}
			createDir(path.resolve(outp, '..'));
			fs.writeFileSync(
				outp,
				str
			);
			resolve(null);
		});
	}));
}