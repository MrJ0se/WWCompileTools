import t_ejs from './t_ejs';
import t_less from './t_less';
import t_pug from './t_pug';
import t_sass from './t_sass';
import t_web from './t_webp';
import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';

import {FileError, createDir} from './t_utils';

/*
extensões transpiladas:
	.webp de
		.t.(jpg/png)
		.t(1-100).(jpg/png)
	.css de
		.t.(less/sass/scss)
	.html de
		.t.(ejs/pug)
*/
interface PromisedTranspil {
	ended:boolean,
	date:Number,
	result:FileError|null,
}
interface FileW {
	type:string,
	ip:string,
	transpil:PromisedTranspil,
	postTranspilStartEdit:boolean,
	deleted:boolean
};
interface Watcher {
	w:chokidar.FSWatcher,
	idir:string,
	odir:string,
	files:Map<string,FileW>,
	thread_id:number,
	stop:()=>void,
}
function startTranspil(file:FileW, op:string) {
	file.transpil.ended = false;
	file.transpil.result = null;
	let type = file.type;
	let inp = file.ip;
	let outp = op;
	(async function (){
		if (type == "IG") {}//ignore
		else if (type == "EJS")
			file.transpil.result = await t_ejs(inp, outp);
		else if (type == "PUG")
			file.transpil.result = await t_pug(inp, outp);
		else if (type == "LESS")
			file.transpil.result = await t_less(inp, outp);
		else if (type == "SASS")
			file.transpil.result = await t_sass(inp, outp);
		else if (type.indexOf('W:')==0) {
			var q = parseInt(type.substr(2));
			file.transpil.result = await t_web(inp, outp, q);
		} else {
			createDir(path.resolve(outp, '..'));
			fs.copyFileSync(inp, outp);
		}
		file.transpil.ended = true;
	})();
}
function outrename(p:string):{op:string,type:string} {
	if (p.lastIndexOf('.ts') == p.length - 3)
		return {op:p,type:"IG"};
	if (p.lastIndexOf('.t.ejs') == p.length - 6)
		return {op:p.substr(0,p.length - 6) + ".html", type:"EJS"};
	if (p.lastIndexOf('.t.pug') == p.length - 6)
		return {op:p.substr(0,p.length - 6) + ".html", type:"PUG"};
	if (p.lastIndexOf('.t.less') == p.length - 7)
		return {op:p.substr(0,p.length - 7) + ".css", type:"LESS"};
	if (p.lastIndexOf('.t.sass') == p.length - 7 || p.lastIndexOf('.t.scss') == p.length - 7)
		return {op:p.substr(0,p.length - 7) + ".css", type:"SASS"};
	if (p.lastIndexOf('.t.png') == p.length - 6 || p.lastIndexOf('.t.jpg') == p.length - 6)
		return {op:p.substr(0,p.length - 6) + ".webp", type:"W:80"};
	if (p.lastIndexOf('.png') == p.length - 4 || p.lastIndexOf('.jpg') == p.length - 4) {
		let tindex = p.lastIndexOf('.t');
		if (tindex > 0) {
			let q = parseInt(p.substring(tindex+2,p.length-4), 10);
			if (!isNaN(q) && q>=1 && q<=100)
				return {op:p.substr(0,tindex) + ".webp", type:"W:"+q};
		}
	}
	return {op:p,type:'copy'};
}
function addFile(ip:string, w:Watcher) {
	let meta = outrename(path.resolve(w.odir, path.relative(w.idir, ip)));
	let op = meta.op;
	if (w.files.has(op)) {
		let ref = w.files.get(op) as FileW;
		if (ref.deleted) {
			ref.deleted = false;
		}
		if (!ref.transpil.ended) {
			ref.postTranspilStartEdit = true;
		} else {
			startTranspil(ref, op);
		}
	} else {
		let ref = {
			type:meta.type,
			ip,
			transpil:{
				ended:true,
				date:0,
				result:null
			},
			postTranspilStartEdit:false,
			deleted:false
		};
		startTranspil(ref, op);
		w.files.set(op, ref);
	}
}
function deleteFile(ip:string, w:Watcher) {
	let op = outrename(path.resolve(w.odir, path.relative(w.idir, ip))).op;
	if (w.files.has(op)) {
		var ref = w.files.get(op) as FileW;
		ref.deleted = true;
		if (ref.transpil.ended == true) {
			if (fs.existsSync(op))
				fs.unlinkSync(op);
			w.files.delete(op);
		}
	}
}

function printStatus(w:Watcher) {
	let compiles:string[] = [];
	let deletes:string[] = [];
	let errors:string[] = [];

	let fkeys = w.files.keys();

	while (true) {
		let temp = fkeys.next();
		if (temp == null)
			break;
		let ckey = temp.value;
		if (ckey == null)
			break;
		let cref = w.files.get(ckey) as FileW;

		if (cref.deleted) {
			deletes.push(ckey);
			if (cref.transpil.ended) {
			if (fs.existsSync(ckey))
				fs.unlinkSync(ckey);
				w.files.delete(ckey);
			}
		} else if (cref.postTranspilStartEdit) {
			compiles.push(ckey);
			if (cref.transpil.ended) {
				startTranspil(cref, ckey);
				cref.postTranspilStartEdit = false;
			}
		} else {
			if (!cref.transpil.ended) {
				compiles.push(ckey);
			} else if (cref.transpil.result) {
				errors.push(ckey);
			}
		}
	}

	//print
	console.clear();
	if (compiles.length > 0) {
		console.log(`\x1b[33mCompiling files:\x1b[0m`);
		compiles.forEach((v)=>{
			console.log('  ['+(w.files.get(v) as FileW).type+']'+path.relative(w.odir,v));
		});
	}
	if (deletes.length > 0) {
		console.log(`\x1b[37mDeleted files:\x1b[0m`);
		deletes.forEach((v)=>{
			console.log('  '+path.relative(w.odir,v));
		});
	}
	if (errors.length > 0) {
		console.log(`\x1b[31mErrors:\x1b[0m`);
		errors.forEach((v)=>{
			let ref = (w.files.get(v) as FileW);
			if (ref.transpil.result) {
				let eref = ref.transpil.result;
				console.log('  ['+ref.type+']'+path.relative(w.idir,eref.file)+": "+eref.error);
			}
		});
	}
}
export default function createWatcher(idir:string, odir:string):Watcher {
	idir = path.resolve(idir);
	odir = path.resolve(odir);
	let w = chokidar.watch(idir);
	let objw = {
		w,idir,odir,
		files:new Map<string,FileW>(),
		thread_id:0,
		stop:function(){
			this.w.close();
			clearInterval(this.thread_id);
		}
	};
	w
		.on('add', (fpath)=>{
			fpath = path.resolve(fpath);
			addFile(fpath, objw);
		})
		.on('change', (fpath)=>{
			fpath = path.resolve(fpath);
			addFile(fpath, objw);
		})
		.on('unlink', (fpath)=>{
			fpath = path.resolve(fpath);
			deleteFile(fpath, objw);
		});
	//@ts-ignore
	objw.thread_id = setInterval(printStatus, 350, objw) as number;
	return objw;
}