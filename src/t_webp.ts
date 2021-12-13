import {FileError, createDir} from './t_utils';
import path from 'path';
//@ts-ignore
import webp from 'webp-converter';
webp.grant_permission();

export default async function compile_webp (inp:string, outp:string, q:number):Promise<FileError|null> {
	createDir(path.resolve(outp, '..'));

	let result = await webp.cwebp(inp, outp,"-q "+q);
	if (result!='')
		return {
			file:inp,
			error:result as string
		};
	return null;
}