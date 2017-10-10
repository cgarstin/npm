import PATH from 'path';
import { transformFile as Babel } from 'babel-core';
import { $ } from '../tools';
import Out from '../out';
import { Config, Package } from '../config';

process.env.NODE_ENV = 'production';

/**
 * Transpiles your project using **babel**.
 * @module Build
 * @memberof Scripts
 */
export default function Build() {

    const src$ = $
        .fromDirRequire(Config.directories.src)
        .mergeMap(dir => $.fromDirReadRecursive(dir))
        .map(node => node.path)
        .filter(path => PATH.extname(path) === PATH.extname(__filename))
        .mergeMap(path => $.bindNodeCallback(Babel)(path, Config[Package.name].babel)
            .map(({ code, map }) => ({ path, code, map: map.mappings })),
        );

    const lib$ = $
        .of(Config.directories.out)
        .defaultIfEmpty([])
        // Determine if Dir exists, and if it doesn't create it
        .switchMap(path => $.fromDirRequire(path))
        // List directory contents and delete'em.
        .mergeMap(path => $.fromDirRead(path))
        .mergeMap(node => $.fromShell(`rm -Rf ${node.path}`))
        // Makes sure the deletion finishes
        .toArray();

    lib$
        .concatMapTo(src$)
        .mergeMap(function writeMap(node) {
            const dest = node.path.replace(
                PATH.resolve(Config.directories.src),
                PATH.resolve(Config.directories.out),
            );
            return $
                .fromShell(`mkdir -p ${PATH.dirname(dest)}`)
                .concatMapTo([
                    { path: dest, content: node.code || '' },
                    { path: `${dest}.map`, content: node.map || '' },
                ])
                .mergeMap(({ path, content }) => $
                    .fromFileWrite(path, content)
                    .mapTo(path.replace(process.cwd(), '.'))
                    .filter(p => !p.match(/\.map$/)),
                );
        })
        .subscribe(
            Out.info,
            Out.error,
            () => Out.good('Built.'),
        );
}
