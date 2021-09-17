import { Rhino3dmLoader } from "three/examples/jsm/loaders/3DMLoader";
import { PLYExporter } from "three/examples/jsm/exporters/PLYExporter";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter"
import { saveAs } from "file-saver";
import * as fflate from "fflate";

const loader = new Rhino3dmLoader()
loader.setLibraryPath('rhino3dm@0.15.0-beta/') // Or using a CDN https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/
let exporter

/**
 * 
 * @param {String[]} urls List of URLs to 3DM files to process.
 * @param {String} format Export format. Can be "3dm", "obj" or "ply".
 * @param {String} zipFileName Name of the compressed folder to be generated.
 * @param {Number} compressionRate Compression rate from 0 (no compression) to 9. Defaults to 0.
 * @returns void
 */
export function batchConvertZipAndDownload(urls, format, zipFileName, compressionRate = 0) {
    let data
    switch (format) {
        case "3dm":
            data = batchGet(format, urls)
            break
        case "ply":
            exporter = new PLYExporter()
            data = batchGet(format, urls, plyExporterHelper)
            break
        case "obj":
            exporter = new OBJExporter()
            data = batchGet(format, urls, objExporterHelper)
            break
        default:
            console.error("Unsupported export format requested. Should be '3dm', 'obj' or 'ply'.")
    }
    save(zip(data, compressionRate), zipFileName, "application/zip")
}

/**
 * 
 * @param {String} url URL to the Rhino3DM file
 * @param {String} format Export format. Can be "3dm", "obj" or "ply".
 * @returns void
 */
export function convertAndDownload(url, format) {
    let data
    let fileType = format == "3dm" ? "application/3dm" :
                   format == "obj" ? "application/obj" :
                   format == "ply" ? "application/ply" :
                   null
    switch (format) {
        case "3dm":
            data = get(format, url)
            break
        case "ply":
            exporter = new PLYExporter()
            data = get(format, url, plyExporterHelper)
            break
        case "obj":
            exporter = new OBJExporter()
            data = get(format, url, objExporterHelper)
            break
        default:
            console.error("Unsupported export format requested. Should be '3dm', 'obj' or 'ply'.")
    }
    data.then(d => {
        save(
            new Promise(resolve => resolve(d[1])),
            d[0],
            fileType
        )
    })
}

function plyExporterHelper(threeGeometry) {
    return new Promise(resolve => {
        exporter.parse(
            threeGeometry,
            plyExported => resolve(new Uint8Array(plyExported)),
            { binary: true }
        )
    })
}

function objExporterHelper(threeGeometry) {
    return new Promise(resolve => {
        const te = new TextEncoder()
        resolve(
            te.encode(
                exporter.parse(threeGeometry)
            )
        )
    })
}

function formatConverter(url, filename, formatHelper) {
    return new Promise(resolve => {
        loader.load(
            url,
            threeGeometry => {
                let exportedData = formatHelper(threeGeometry)
                exportedData.then(d => resolve([filename, d]))
            }
        )
    })
}

function rhino3dmDownloader(url, filename) {
    return fetch(url)
        .then((res) => res.arrayBuffer())
        .then((fileBuffer) => [filename, new Uint8Array(fileBuffer)]);
}

function batchGet(format, urls, formatHelper) {
    return urls.map(url => {
        let filename = url.substring(url.lastIndexOf("/") + 1)
        filename = filename.substring(0, filename.lastIndexOf(".") + 1) + format
        if (format == "3dm") {
            return rhino3dmDownloader(url, filename)
        }
        else {
            return formatConverter(url, filename, formatHelper)
        }
    });
}

function get(format, url, formatHelper) {
    console.log(url)
    let filename = url.substring(url.lastIndexOf("/") + 1)
    filename = filename.substring(0, filename.lastIndexOf(".") + 1) + format
    if (format == "3dm") {
        return rhino3dmDownloader(url, filename)
    }
    else {
        return formatConverter(url, filename, formatHelper)
    }

}

function zip(pendingData, compressionRate) {
    return new Promise(resolve => {
        Promise.all(pendingData).then(resolvedData => {
            resolve(fflate.zipSync(
                Object.fromEntries(resolvedData),
                { level: compressionRate }
            ))
        })
    })
}

function save(pendingData, downloadFileName, downloadFileType) {
    pendingData.then(resolvedData => {
        console.log(resolvedData)
        saveAs(
            new Blob(
                [resolvedData],
                { type: downloadFileType }
            ),
            downloadFileName
        )
    })
}
