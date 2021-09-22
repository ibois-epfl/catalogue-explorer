<!-- 
@author: Aymeric Broyet
@date: 20210921
 -->
# Catalogue Explorer

A web application for viewing, filtering and downloading 3D representations (point cloud, mesh, minimum volume bounding box) and metadata of scanned objects.

A demo of this web application is running at [https://ibois-epfl.github.io/catalogue-explorer/](https://ibois-epfl.github.io/catalogue-explorer/)

## Intro

This web app comes with [Catalogue Exporter](https://github.com/ibois-epfl/catalogue-exporter), a plugin for the CAD software Rhinoceros which generate formatted database from point clouds thanks to the [Cockroach plugin](https://github.com/9and3/Cockroach) for Rhinoceros. Formatted data is then handed to this web app for viewing, filtering and selective downloading.

## Dependencies

The web app is using the front-end compiler [Svelte](https://svelte.dev), and the UI library [Carbon components for Svelte](https://github.com/carbon-design-system/carbon-components-svelte).
Data structure manipulations are handled using [D3](https://github.com/d3/d3/) and 3d files are packed using [fflate](https://github.com/101arrowz/fflate) and [FileSaver](https://github.com/eligrey/FileSaver.js/). 3d file conversion is handled with [three.js](https://threejs.org/) and [rhino3dm.js](https://github.com/mcneel/rhino3dm).

## Architecture

This web app is designed to be hosted on a static server. Hence, the application's logic is handled client-side.

The database is stored as a CSV file containing a pair of `(identifier, parent)` keys. This table-like file is parsed by the application which generates the data tree structure used to display and filter and fetch 3d content.

The 3d files are stored as Rhino 3DM files and prefixed by their identifier (UUID).

## Directory structure

All the app source files are located in the `/src` directory. The `/public` directory contains the files you will need to place on your production web server.

In-depth, subdirectory `/public/build` contains the compiled scripts and styles generated during the building steps detailed below. Subdirectory `/public/data` contains the 3d models and structured metadata displayed and manipulated by the web application. The content of this directory is given as an example and actual data is generated by the [Catalogue Exporter](https://github.com/ibois-epfl/catalogue-exporter) plugin for CAD software Rhinoceros 3D.

## Development

The project is based on the [Svelte project template](https://github.com/sveltejs/template) which requires have [Node.js](https://nodejs.org/) installed.

### Installing dependencies

Once you have forked and cloned this repo, you can open a terminal in the repo's root and run the following to resolve the project's dependencies _ie. download the packages listed above_.

```bash
npm install
```

### Running the development environment

Svelte is a compiler which means it takes source files (\*.svelte and others) and bundle them into browser interpretable JavaScript and style sheets. The process of recompiling is done automatically when you save changes to source files with the help of [Rollup](https://rollupjs.org) and its development web server.

The following command is to be run every time you're working on the code and want to see it in action in a web browser.

```bash
npm run dev
```

Then, navigate to [localhost:5000](http://localhost:5000). You should see the app running. Edit a component file in `src`, save it, and reload the page to see your changes.

By default, the server will only respond to requests from localhost. To allow connections from other computers, edit the `sirv` commands in package.json to include the option `--host 0.0.0.0`.

If you're using [Visual Studio Code](https://code.visualstudio.com/) you can install the official extension [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode). If you are using other editors you may need to install a plugin to get syntax highlighting and IntelliSense.

## Bundling for production

To create a production-optimised version of the app, run the following.

```bash
npm run build
```

The production-ready app replaces the development version. The `/public` directory is now ready to be deployed on any static web server such as [GitHub Pages](https://pages.github.com/).

If you want to run the production build locally, you can use the following.

```bash
npm run start
```
