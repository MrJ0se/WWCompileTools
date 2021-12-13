# WWCompileTools
watcher to compile EJS, Pug, Sass, Scss, Less and convert PNG/JPG to webp.
## How to use
- install package dependencies (npm install) and run typescript compilation (tsc).
- create a batch "node [path to]/bin/cli.js %*" and add to patch (on windows) or create a alias "alias wwt='node [path to]/bin/cli.js'" (on linux/mac).
- execute: "wwt <origin path> <dest path>"
## effects
- the .ts files is ignored.
- the compatible files, with ".t" before extension is compiled converted:
  - css files: .t.less .t.sass .t.scss
  - html files: .t.pug .t.ejs
  - webp files: .t.png .t.jpg (obs.: default quality is 80, but it can be specified in extension, exemple: .t30.png, a png that must be converted to webp with quality level 30)
- rest is copied.
