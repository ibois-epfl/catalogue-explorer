// @author: Aymeric Broyet
// @date: 20210921

import { Rhino3dmLoader } from "three/examples/jsm/loaders/3DMLoader";
import { PLYExporter } from "three/examples/jsm/exporters/PLYExporter";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter"
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { saveAs } from "file-saver";
import * as fflate from "fflate";

const loader = new Rhino3dmLoader()
loader.setLibraryPath('rhino3dm@0.15.0-beta/') // Or using a CDN https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/

const te = new TextEncoder()

/**
 * 
 * @param {String[]} urls List of URLs to 3DM files to process.
 * @param {String} format Export format. Can be '3dm', 'obj', 'ply' or 'gltf'.
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
            data = batchGet(format, urls, plyExporterHelper)
            break
        case "obj":
            data = batchGet(format, urls, objExporterHelper)
            break
        case "gltf":
            data = batchGet(format, urls, gltfExporterHelper)
            break
        default:
            console.error("Unsupported export format requested. Should be '3dm', 'obj', 'ply' or 'gltf'.")
    }
    save(zip(data, compressionRate), zipFileName, "application/zip")
}

/**
 * 
 * @param {String} url URL to the Rhino3DM file
 * @param {String} format Export format. Can be '3dm', 'obj', 'ply' or 'gltf'.
 * @returns void
 */
export function convertAndDownload(url, format) {
    let data
    let fileType = format == "3dm" ? "model/3dm" :
                   format == "obj" ? "model/obj" :
                   format == "ply" ? "model/ply" :
                   format == "gltf" ? "model/gltf+json" :
                   null
    switch (format) {
        case "3dm":
            data = get(format, url)
            break
        case "ply":
            data = get(format, url, plyExporterHelper)
            break
        case "obj":
            data = get(format, url, objExporterHelper)
            break
        case "gltf":
            data = get(format, url, gltfExporterHelper)
            break
        default:
            console.error("Unsupported export format requested. Should be '3dm', 'obj', 'ply' or 'gltf'.")
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
    const exporter = new PLYExporter()
    return new Promise(resolve => {
        exporter.parse(
            threeGeometry,
            exportedGeometry => resolve(te.encode(exportedGeometry)),
        )
    })
}

function objExporterHelper(threeGeometry) {
    const exporter = new OBJExporter()
    return new Promise(resolve => {
        resolve(te.encode(exporter.parse(threeGeometry)))
    })
}

function gltfExporterHelper(threeGeometry) {
    const exporter = new GLTFExporter()
    return new Promise(resolve => {
        exporter.parse(
            threeGeometry,
            exportedGeometry => resolve(te.encode(JSON.stringify(exportedGeometry))),
        )
    })
}

function formatConverter(url, filename, formatHelper, progress) {
    return new Promise(resolve => {
        loader.load(
            url,
            threeGeometry => {
                let exportedData = formatHelper(threeGeometry)
                exportedData.then(d => resolve([filename, d]))
                triggerEvent(progress/2, filename)
            },
            xhr => {
                if (xhr.loaded == xhr.total) {
                    triggerEvent(progress/2, filename)
                }
            }
        )
    })
}

function rhino3dmDownloader(url, filename, increment) {
    return fetch(url)
        .then((res) => res.arrayBuffer())
        .then((fileBuffer) => {
            triggerEvent(increment, filename)
            return [filename, new Uint8Array(fileBuffer)]
        });
}

function triggerEvent(increment, filename) {
    let saveEvent = new CustomEvent("fileSaveTriggered", {
        detail: {
            increment: increment,
            filename: filename
        }
    })
    document.dispatchEvent(saveEvent)
}

function batchGet(format, urls, formatHelper) {
    let count = urls.length
    return urls.map(url => {
        let filename = url.substring(url.lastIndexOf("/") + 1)
        filename = filename.substring(0, filename.lastIndexOf(".") + 1) + format
        if (format == "3dm") {
            return rhino3dmDownloader(url, filename, 100/count)
        }
        else {
            return formatConverter(url, filename, formatHelper, 100/count)
        }
    });
}

function get(format, url, formatHelper) {
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
        saveAs(
            new Blob(
                [resolvedData],
                { type: downloadFileType }
            ),
            downloadFileName
        )
    })
}