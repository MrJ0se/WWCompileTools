import watcher from './watcher';

(function(args:string[]){
	if (args.length < 3) {
		console.log('No enough arguments.');
		console.log('use: <orig path> [<dest path>]');
		return;
	}
	if (args.length > 4) {
		console.log('Too arguments.');
		console.log('use: <orig path> [<dest path>]');
	}
	var ip = args[3];
	var op = args[4] || '.';
	watcher(ip, op); 
})([...process.argv]);