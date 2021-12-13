import ts from 'typescript';
import pug from 'pug';
import ejs from 'ejs';
import sass from 'sass';
import less from 'less';
//@ts-ignore
import webp from 'webp-converter';
webp.grant_permission();

import chokidar from 'chokidar';

import fs from 'fs';
import path from 'path';

const WatchTimeout = 250;

export interface TranspilersConfig {
	inputDir:string;
	outputDir:string;
	ts:boolean;
	pug:boolean;
	ejs:boolean;
	sass:boolean;
	less:boolean;
	webp:boolean;
	//deve ser de 1 a 100
	webpQuality:number;
	//copiar arquivos não transpilados
	copy:boolean;
};
export interface FileError {
	fullpath:string;
	errors:string;
}

export class Transpilers {
	config:TranspilersConfig;
	tsConfig?:ts.CompilerOptions;

	errors:FileError[]=[];
	configFilePath:string;
	static printFileErrors(errors:FileError[]) {
		errors.forEach((e)=>{
			console.log(e.fullpath);
			console.log(e.errors.split('\n').map((e)=>'  '+e).join('\n'));
		})
	}

	constructor(config:TranspilersConfig) {
		createDir(config.inputDir);
		this.config = config;
		this.configFilePath = path.resolve(this.config.inputDir,'tsconfig.json');
		if (config.ts) {
			const configFile = ts.findConfigFile(config.inputDir, ts.sys.fileExists, 'tsconfig.json');
			if (!configFile) throw Error('tsconfig.json not found');
			this.tsConfig = ts.readConfigFile(configFile, ts.sys.readFile).config.compilerOptions;
			if (this.tsConfig) {
				this.tsConfig.rootDir = config.inputDir;
				this.tsConfig.outDir = config.outputDir;
				//@ts-ignore
				this.tsConfig.moduleResolution = (this.tsConfig.moduleResolution&&this.tsConfig.moduleResolution=='node')?ts.ModuleResolutionKind.NodeJs:ts.ModuleResolutionKind.Classic;
			}
		}
	}
	//ignoreTime= transpilar ignorando o mtime dos arquivos de destino
	async transpileAll(ignoreTime:boolean) {
		this.errors = [];
		let fileNames = getFilesInfoFolder(this.config.inputDir);
		if (this.config.ts) {
			var ip = -1;
			for (let i = 0; i < fileNames.length; i++) {
				if(fileNames[i].filepath == this.configFilePath) {
					ip = i;
					break;
				}
			}
			if (ip>=0)
				fileNames.splice(ip, 1);
		}
		if (!ignoreTime) {
			//excluir da transpilação arquivos já transpilados depois da alteração do original
			/*

			falta implementar

			*/
		}
		await this.transpileFiles(fileNames.map((x)=>x.filepath));
	}
	watchCBbusy?:(tfiles:string[],dfiles:string[])=>void;
	watchCBfree?:()=>void;

	__watchPedentTranspiler:string[]=[];
	__watchPedentDelete:string[]=[];
	__watchTimeoutVar?:any;
	//Livre|Aguardando|Transpilando|Pendentes
	__watchState:"L"|"A"|"T"|"P"="L";
	__watchAddTraspiler(fpath:string) {
		if (this.config.ts && fpath == this.configFilePath)
			return;
		this.__watchPedentTranspiler.push(fpath);
		this.__watchAddEvent();
	}
	__watchAddDelete(fpath:string) {
		this.__watchPedentDelete.push(fpath);
		this.__watchAddEvent();
	}
	__watchAddEvent() {
		switch (this.__watchState) {
		case 'A':
			clearTimeout(this.__watchTimeoutVar);
			this.__watchTimeoutVar = setTimeout(()=>this.__watchTimeout(),WatchTimeout);
			break;
		case 'L':
			this.__watchTimeoutVar = setTimeout(()=>this.__watchTimeout(),WatchTimeout);
			this.__watchState = 'A';
			break;
		case 'T':
			this.__watchState = 'P';
		}
	}
	async __watchTimeout() {
		this.__watchState = 'T';
		let tfiles = this.__watchPedentTranspiler;
		this.__watchPedentTranspiler = [];
		let dfiles = this.__watchPedentDelete;
		this.__watchPedentDelete = [];
		if (this.watchCBbusy)
			this.watchCBbusy(tfiles,dfiles);
		dfiles.forEach((e)=>{
			e = this.translateToOutputPath(e);
			if (fs.existsSync(e))
				fs.unlinkSync(e);
		});
		await this.transpileFiles(tfiles);
		if (this.watchCBfree)
			this.watchCBfree();
		//@ts-ignore
		if (this.__watchState == 'P') {
			this.__watchTimeoutVar = setTimeout(()=>this.__watchTimeout(),WatchTimeout);
			this.__watchState = 'A';
		} else
			this.__watchState = 'L';
	}
	__watcher?:chokidar.FSWatcher;
	transpileWatchStart() {
		this.__watcher = chokidar.watch(this.config.inputDir);
		this.__watcher
			.on('add', (fpath)=>{
				fpath = path.resolve(fpath);
				this.__watchAddTraspiler(fpath);
			})
			.on('change', (fpath)=>{
				fpath = path.resolve(fpath);
				this.__watchAddTraspiler(fpath);
			})
			.on('unlink', (fpath)=>{
				fpath = path.resolve(fpath);
				this.__watchAddDelete(fpath);
			});
	}
	async transpileWatchEnd() {
		if (this.__watcher != undefined) {
			await this.__watcher.close();
			this.__watcher = undefined;
		}
	}
	translateToOutputPath(fpath:string):string {
		if (this.tsConfig != undefined) {
			if (fpath.length>=3&&fpath.substring(fpath.length-3)=='.ts')
				return buildPath(fpath, this.config.inputDir, this.config.outputDir, '.js');
		}
		if (this.config.pug) {
			if (fpath.length>=4&&fpath.substring(fpath.length-4)=='.pug')
				return buildPath(fpath, this.config.inputDir, this.config.outputDir, '.pug');
		}
		if (this.config.ejs) {
			if (fpath.length>=4&&fpath.substring(fpath.length-4)=='.ejs')
				return buildPath(fpath, this.config.inputDir, this.config.outputDir, '.ejs');
		}
		if (this.config.sass) {
			if (fpath.length>=5) {
				let frag = fpath.substr(fpath.length-5);
				if (frag == '.scss' || frag == '.sass')
					return buildPath(fpath, this.config.inputDir, this.config.outputDir, '.css');
			}
		}
		if (this.config.less) {
			if (fpath.length>=5&&fpath.substring(fpath.length-5)=='.less')
				return buildPath(fpath, this.config.inputDir, this.config.outputDir, '.less');
		}
		if (this.config.webp) {
			if (fpath.length>=4) {
				let frag = fpath.substr(fpath.length-4);
				if (frag == '.png' || frag == '.jpg' || frag == '.gif')
					return buildPath(fpath, this.config.inputDir, this.config.outputDir, '.webp');
			}
		}
		if (this.config.copy)
			return buildPath2(fpath, this.config.inputDir, this.config.outputDir);
		return '';
	}
	async transpileFiles(fileNames: string[]) {
		fileNames.forEach((fname)=>{
			this.errors = this.errors.filter((er)=>er.fullpath!=fname);
		});
		if (this.tsConfig != undefined) {
			this.errors.push(
				...compile_ts(
					fileNames
						.filter((x)=>
							x.length>=3&&
							x.substr(x.length-3)=='.ts'),
					this.config,
					this.tsConfig)
			);
			fileNames = fileNames
				.filter((x)=>
					x.length<3||
					x.substr(x.length-3)!='.ts');
		}
		if (this.config.pug) {
			this.errors.push(
				...compile_pug(
					fileNames
						.filter((x)=>
							x.length>=4&&
							x.substr(x.length-4)=='.pug'),
					this.config)
			);
			fileNames = fileNames
				.filter((x)=>
					x.length<4||
					x.substr(x.length-4)!='.pug');
		}
		if (this.config.ejs) {
			this.errors.push(
				...(await compile_ejs(
					fileNames
						.filter((x)=>
							x.length>=4&&
							x.substr(x.length-4)=='.ejs'),
					this.config))
			);
			fileNames = fileNames
				.filter((x)=>
					x.length<4||
					x.substr(x.length-4)!='.ejs');
		}
		if (this.config.sass) {
			this.errors.push(
				...compile_sass(
					fileNames
						.filter((x)=>{
							if (x.length<5) return false;
							let frag = x.substr(x.length-5);
							return frag == '.sass' || frag == '.scss';
						}),
					this.config)
			);
			fileNames = fileNames
				.filter((x)=>{
					if (x.length>=5) return true;
					let frag = x.substr(x.length-5);
					return frag != '.sass' && frag != '.scss';
				});
		}
		if (this.config.less) {
			this.errors.push(
				...(await compile_less(
					fileNames
						.filter((x)=>
							x.length>=5&&
							x.substr(x.length-5)=='.less'),
					this.config))
			);
			fileNames = fileNames
				.filter((x)=>
					x.length<5||
					x.substr(x.length-5)!='.less');
		}
		if (this.config.webp) {
			this.errors.push(
				...(await compile_webp(
					fileNames
						.filter((x)=>{
							if (x.length<4) return false;
							let frag = x.substr(x.length-4);
							return frag == '.png' || frag == '.jpg' || frag == '.gif';
						}),
					this.config))
			);
			fileNames = fileNames
				.filter((x)=>{
					if (x.length>=4) return true;
					let frag = x.substr(x.length-4);
					return frag != '.png' && frag != '.jpg' && frag != '.gif';
				});
		}
		if (this.config.copy) {
			fileNames.forEach((x)=>{
				let outfilename = buildPath2(x, this.config.inputDir, this.config.outputDir);
				createDir(path.resolve(outfilename, '..'));
				fs.copyFileSync(x, outfilename);
			});
		}
	}
};

/*
* Utils
*/

function createDir(f:string):void {
	if (fs.existsSync(f))
		return;
	createDir(path.resolve(f,'..'));
	fs.mkdirSync(f);
}
function buildPath(oldpath: string, olddir: string, newdir: string, newextension: string) {
	let dotp = oldpath.lastIndexOf('.');
	if (dotp <= oldpath.lastIndexOf(path.sep))
		dotp = oldpath.length;
	return newdir+oldpath.substring(olddir.length,dotp)+newextension;
}
function buildPath2(oldpath: string, olddir: string, newdir: string) {
	return newdir+oldpath.substring(olddir.length);
}
interface FileInfo {
	filepath:string;
	last_time:number;
};
function getFilesInfoFolder(folder:string):FileInfo[] {
	let ret:FileInfo[] = [];
	fs.readdirSync(folder)
		.forEach((e)=>{
			e = path.resolve(folder,e);
			if (fs.statSync(e).isDirectory()) {
				ret.push(...getFilesInfoFolder(e));
			} else {
				const stats = fs.statSync(e);
				ret.push({
					filepath:e,
					last_time:stats.mtimeMs
				});
			}
		});
	return ret;
}
/*
* Conversões
*/

function compile_ts(fileNames: string[], tconfig: TranspilersConfig, options: ts.CompilerOptions):FileError[] {
	let program = ts.createProgram(fileNames, options);
	let emitResult = program.emit(undefined,
	//WriteFileCallback para evitar reescrever arquivos não alterados no HD
	(fileName: string, data: string)=>{
		let oldfilename = buildPath(fileName, tconfig.outputDir, tconfig.inputDir,'.ts');
		//tconfig.inputDir+fileName.substring(tconfig.outputDir.length);
		//oldfilename = oldfilename.substring(0,oldfilename.length-3)+'.ts';
		if (fileNames.find((x)=>x==oldfilename)) {
			createDir(path.resolve(fileName,'..'));
			fs.writeFileSync(fileName, data);
		}
	});

	let allDiagnostics = ts
		.getPreEmitDiagnostics(program)
		.concat(emitResult.diagnostics);

	if (emitResult.emitSkipped)
		return [];

	let ret:FileError[] = [];
	allDiagnostics.forEach(diagnostic => {
		let erfile:FileError;
		let filename = '';
		if (diagnostic.file)
			filename = diagnostic.file.fileName;
		let temp = ret.find((x)=>x.fullpath==filename);
		if (temp != null) {
			erfile = temp;
		} else {
			erfile = {
				fullpath:filename,
				errors:''
			};
			ret.push(erfile);
		}
		if (diagnostic.file) {
			let { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
			let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
			erfile.errors+=`(${line + 1},${character + 1}): ${message}\n`;
		} else {
			erfile.errors+=ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n") + '\n';
		}
	});
	return ret;
}

function compile_pug (fileNames:string[], tconfig:TranspilersConfig):FileError[] {
	let ret:FileError[] = [];
	for (let i = 0;i < fileNames.length;i++) {
		try {
			let outfilename = buildPath(fileNames[i], tconfig.inputDir, tconfig.outputDir,'.html');
			createDir(path.resolve(outfilename,'..'));
			fs.writeFileSync(outfilename,
				pug.renderFile(fileNames[i])
			);
		} catch(e) {
			ret.push({
				fullpath:fileNames[i],
				errors:e+''
			})
		}
	}
	return ret;
}

async function compile_ejs (fileNames:string[], tconfig:TranspilersConfig):Promise<FileError[]> {
	let ret:FileError[] = [];
	for (let i = 0;i < fileNames.length;i++) {
		await (new Promise((resolve)=>{
			ejs.renderFile(fileNames[i],
			(err,str)=>{
				if (err) {
					ret.push({
						fullpath:fileNames[i],
						errors:err+''
					})
				} else {
					let outfilename = buildPath(fileNames[i], tconfig.inputDir, tconfig.outputDir,'.html');
					createDir(path.resolve(outfilename,'..'));
					fs.writeFileSync(
						outfilename,
						str
					);
				}
				resolve(0);
			});
		}));
	}
	return ret;
}

function compile_sass (fileNames:string[], tconfig:TranspilersConfig):FileError[] {
	let ret:FileError[] = [];
	for (let i = 0;i < fileNames.length;i++) {
		try {
			let r = sass.renderSync({file: fileNames[i]});
			let outfilename = buildPath(fileNames[i], tconfig.inputDir, tconfig.outputDir,'.css');
			createDir(path.resolve(outfilename,'..'));
			fs.writeFileSync(outfilename, r.css);
		} catch(e) {
			let erstring = 'Invalid file';
			if (e.line&&e.column&&e.formatted) {
				erstring =
					`(${e.line},${e.column}): `+ 
					e.formatted.substring(0,e.formatted.indexOf('\n'))+'\n';
			}
			ret.push({
				fullpath:fileNames[i],
				errors:erstring,
			});
		}
	}
	return ret;
}

async function compile_less (fileNames:string[], tconfig:TranspilersConfig):Promise<FileError[]> {
	let ret:FileError[] = [];
	for (let i = 0;i < fileNames.length;i++) {
		await (new Promise((resolve)=>{
			less.render(fs.readFileSync(fileNames[i],'utf-8'),
				{filename:fileNames[i]},
				(e,out)=>{
					if (out) {
						let outfilename = buildPath(fileNames[i], tconfig.inputDir, tconfig.outputDir,'.css');
						createDir(path.resolve(outfilename,'..'));
						fs.writeFileSync(outfilename, out.css);
					} else {
						let erstring = 'Invalid file';
						if (e.line&&e.column&&e.message)
							erstring = `(${e.line},${e.column}): `+ e.message+'\n';
						ret.push({
							fullpath:fileNames[i],
							errors:erstring,
						});
					}
					resolve(0);
				});
		}));
	}
	return ret;
}

async function compile_webp (fileNames: string[], tconfig: TranspilersConfig):Promise<FileError[]> {
	let ret:FileError[] = [];
	for (let i = 0;i < fileNames.length;i++) {
		let outfilename = buildPath(fileNames[i], tconfig.inputDir, tconfig.outputDir,'.webp');
		createDir(path.resolve(outfilename,'..'));
		//@ts-ignore
		let result = await webp.cwebp(fileNames[i], outfilename,"-q "+tconfig.webpQuality);
		if (result!='') {
			ret.push({
				fullpath:fileNames[i],
				errors:result
			});
		}
	}
	return ret;
}