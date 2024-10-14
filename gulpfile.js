import {deleteAsync} from 'del'
import gulpAutoprefixer from 'gulp-autoprefixer'
import Gulp from 'gulp'
import GulpLess from 'gulp-less'
import GulpLiveReload from 'gulp-livereload'
import GulpCssNano from 'gulp-cssnano'
import GulpConcat from 'gulp-concat'
import GulpUglify from 'gulp-uglify'
import GulpCssBeautify from 'gulp-cssbeautify'
import GulpReplace from 'gulp-replace'
import GulpRename from 'gulp-rename'
import LessPluginGlob from 'less-plugin-glob'

const gulp = Gulp
const livereload = GulpLiveReload
const rename = GulpRename
const less = GulpLess
const autoprefixer = gulpAutoprefixer
// const combineMq = require('gulp-combine-mq') // error with fs.js primordial something
const cssnano = GulpCssNano
const concat = GulpConcat
const uglify = GulpUglify
const cssbeautify = GulpCssBeautify
const lessGlob = LessPluginGlob
var replace = GulpReplace;

const dist = './dist';

const compileCSS = () => {
	return gulp.src('./src/hesh.less')
		.pipe(less({
			plugins: [lessGlob]
		}))
		.pipe(autoprefixer({
			flexbox: 'no-2009'
			// cascade: false
		}))
		// .pipe(combineMq({
		// 	beautify: true
		// }))
		// .pipe(cssnano({
		// 	discardComments: false
		// }))
		.pipe(cssbeautify({
			indent: '  ',
			autosemicolon: true
		}))
		.pipe(rename('hesh.css'))
		.pipe(gulp.dest(dist))
		.pipe(livereload())
}

const minifyCSS = () => {
	return gulp.src(dist + '/hesh.css')
		.pipe(cssnano())
		// we beautify afterward so the file is editable in the WP Plugin Editor
		.pipe(cssbeautify({
			indent: '  ',
			autosemicolon: true
		}))
		// .pipe(rename(path => path.basename += '.min'))
		.pipe(gulp.dest(dist))
}

const compileJS = () => {
	const codemirrorPath = './node_modules/codemirror/'
	const customModesPath = './src/modes/'

	return gulp.src([

		// CodeMirror Core
		codemirrorPath + 'lib/codemirror.js',

		// Modes
		codemirrorPath + 'mode/xml/xml.js',
		codemirrorPath + 'mode/javascript/javascript.js',
		codemirrorPath + 'mode/css/css.js',
		codemirrorPath + 'mode/htmlmixed/htmlmixed.js',
		codemirrorPath + 'mode/clike/clike.js',
		codemirrorPath + 'mode/php/php.js',

		// Custom Modes
		customModesPath + 'shortcode.js',
		customModesPath + 'wordpresspost.js',

		// AddOns
		codemirrorPath + 'addon/selection/active-line.js',
		codemirrorPath + 'addon/search/searchcursor.js',
		codemirrorPath + 'addon/search/search.js',
		codemirrorPath + 'addon/dialog/dialog.js',
		codemirrorPath + 'addon/scroll/simplescrollbars.js',
		codemirrorPath + 'addon/comment/comment.js',

		codemirrorPath + 'addon/fold/foldcode.js',
		codemirrorPath + 'addon/fold/foldgutter.js',
		codemirrorPath + 'addon/fold/xml-fold.js',
		// codemirrorPath + 'addon/fold/brace-fold.js', // for JS
		// codemirrorPath + 'addon/fold/comment-fold.js',
		codemirrorPath + 'addon/fold/indent-fold.js',

		codemirrorPath + 'addon/edit/matchbrackets.js',
		codemirrorPath + 'addon/edit/matchtags.js',
		codemirrorPath + 'addon/search/match-highlighter.js',
		codemirrorPath + 'addon/edit/closetag.js',
		codemirrorPath + 'addon/edit/closebrackets.js',

		codemirrorPath + 'keymap/sublime.js',
		codemirrorPath + 'keymap/emacs.js',
		codemirrorPath + 'keymap/vim.js',

		// ... and finally ...
		// HESH
		'./src/hesh.js',
	])
		.pipe(concat('hesh.js'))
		.pipe(gulp.dest(dist))
		.pipe(livereload())
}

const minifyJS = () => {
	return gulp.src(dist + '/hesh.js')
		.pipe(uglify())
		// .pipe(rename(path => path.basename += '.min'))
		.pipe(gulp.dest(dist))
}

const copyPluginFiles = () => {
	return gulp.src([
		'./src/*.php',
		'./src/readme.txt'
	])
		.pipe(gulp.dest(dist))
		.pipe(livereload())
}

const copyAssets = () => {
	return gulp.src([
		'./assets/banner-772x250.*',
		'./assets/banner-1544x500.*',
		'./assets/icon-128x128.*',
		'./assets/icon-256x256.*',
		'./assets/icon.svg',
		'./assets/screenshot-*',
	])
		.pipe(gulp.dest(dist + '/assets'))
}

const removeDevTitle = () => {
	return gulp.src([
		dist + '/*.php',
		dist + '/readme.txt'
	])
		.pipe(replace('!DEV!', ''))
		.pipe(gulp.dest(dist))
}

const buildReadMeTxt = () => {
	/* TODO: merge:
		- the comments in the head of the php file
		- the features and description from Readme.md
		- the FAQ.md
		- the list of screenshot captions
		- regex replace # TITLES with === TITLES ===
	*/
}

async function clean () {
	await deleteAsync([
		dist + '/[^.]*.*', // anything that is not .hidden
	], { force: true });
}

const watch = () => {
	livereload.listen()
	gulp.watch([
		'./src/*.php',
	], copyPluginFiles)
	gulp.watch([
		'./src/**/*.css',
		'./src/**/*.less',
	], compileCSS)
	gulp.watch([
		'./src/**/*.js'
	], compileJS)
}

const compile = gulp.parallel(compileCSS, compileJS, copyPluginFiles)
const minify = gulp.parallel(minifyCSS, minifyJS)
const dev = gulp.series(clean, compile, watch)

const build = gulp.series(clean, compile, minify)
const packaging = gulp.series(build, removeDevTitle, copyAssets)

gulp.task('compile', compile)
gulp.task('build', build)
gulp.task('packaging', packaging)
gulp.task('dev', dev)
gulp.task('default', dev)
