<!-- 
@author: Aymeric Broyet
@date: 20210921
 -->
<script>
  export let promDatabaseLeaves;
  export let activeId;

  import {
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
    ToolbarMenu,
    ToolbarMenuItem,
    ToolbarBatchActions,
    Button,
    Modal,
    ComposedModal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Grid,
    Row,
    Column,
    Dropdown,
    Select,
    SelectItem,
    ProgressBar,
  } from "carbon-components-svelte";
  import Save16 from "carbon-icons-svelte/lib/Save16";

  import {
    batchConvertZipAndDownload,
    convertAndDownload,
  } from "./batchConvertAndZip";

  /**
   * A promise fullfilled in an object formatted and supplied to the DataTable component.
   * @type {Promise<Object>}
   */
  let promTableFormattedDatabase = promDatabaseLeaves.then((leavesFull) => {
    let leaves = leavesFull.leaves;
    let d = leavesFull.leavesData;
    let headers = Object.keys(d[0]).map((i) => {
      return { key: i, value: i };
    });
    let rows = d.map((i, index) => {
      i.id = index;
      return i;
    });
    let out = { headers: headers, rows: rows, leaves: leaves };

    return out;
  });

/**
 * Indice of the clicked row for 3dViewer modal opening
 * @type {number}
 */
  let currentRow;

  /**
   * Sets the modal open variable to true. Sets the modal item ID to corresponding clicked row object ID.
   * @returns {void}
   */
  function cellClicked() {
    modal3dViewItemId = currentRow.detail.item;
    modal3dViewOpen = true;
  }
  let modal3dViewItemId = "";
  let modal3dViewOpen = false;

  let filterValue;
  let filterColumn = "all";

  let selectedRowIds = [];

  let loadingOverlayOpen = false;

  let loadingProgress = 0;
  let loadingFilename;

  document.addEventListener("fileSaveTriggered", (event) => {
    loadingProgress = loadingProgress + event.detail.increment;
    loadingFilename = event.detail.filename;
    if (100 - loadingProgress < Number.EPSILON) {
      // Number.EPSILON Prevent floating point number operations errors.
      loadingFilename = "Finished";
    }
  });

  function downloadBatch(rows) {
    loadingOverlayOpen = true;
    let rhino3dmFilenames = selectedRowIds
      .map((id) => rows.filter((row) => row.id == id)[0])
      .map((row) => {
        let filename = row.item + downloadTypes[downloadTypeIndex].id;
        return filename.substring(0, filename.lastIndexOf(".")) + ".3dm";
      });

    let urls = rhino3dmFilenames.map((filename) => "data/3dm/" + filename);

    let format = downloadTypes[downloadTypeIndex].id;
    format = format.substring(format.lastIndexOf(".") + 1);

    batchConvertZipAndDownload(
      urls,
      format,
      "Selection " + downloadTypes[downloadTypeIndex].text + ".zip",
      0
    );
  }

  let downloadTypeIndex = 0;
  let downloadTypes = [
    {
      id: "_PointCloud.3dm",
      text: "3DM - Point cloud (original)",
    },
    {
      id: "_PointCloud_Downsampled.3dm",
      text: "3DM - Point cloud (voxel downsampled)",
    },
    {
      id: "_MinBBox.3dm",
      text: "3DM - MVBB (Minimal Volume Bounding Box)",
    },
    {
      id: "_Mesh.3dm",
      text: "3DM - Mesh (Poisson reconstruction)",
    },
    {
      id: "_PointCloud.obj",
      text: "OBJ - Point cloud (original)",
    },
    {
      id: "_PointCloud_Downsampled.obj",
      text: "OBJ - Point cloud (voxel downsampled)",
    },
    {
      id: "_Mesh.obj",
      text: "OBJ - Mesh (Poisson reconstruction)",
    },
    {
      id: "_Mesh.ply",
      text: "PLY - Mesh (Poisson reconstruction)",
    },
    {
      id: "_PointCloud.gltf",
      text: "glTF - Point cloud (original)",
    },
    {
      id: "_PointCloud_Downsampled.gltf",
      text: "glTF - Point cloud (voxel downsampled)",
    },
    {
      id: "_Mesh.gltf",
      text: "glTF - Mesh (Poisson reconstruction)",
    },
  ];

  function download3dFile(id) {
    let format = downloadTypes[downloadTypeIndex].id;
    format = format.substring(format.lastIndexOf(".") + 1);
    let geometryType = downloadTypes[downloadTypeIndex].id;
    geometryType = geometryType.substring(0, geometryType.lastIndexOf("."));
    convertAndDownload("data/3dm/" + id + geometryType + ".3dm", format);
  }
</script>

{#await promTableFormattedDatabase}
  Loading ...
{:then tableFormattedDatabase}
  <DataTable
    sortable
    expandable
    batchSelection
    bind:selectedRowIds
    headers={tableFormattedDatabase.headers}
    rows={tableFormattedDatabase.rows
      .filter((row) => {
        let node;
        tableFormattedDatabase.leaves.forEach((n) => {
          if (row.item == n.data.item) node = n;
        });
        return node
          .ancestors()
          .map((ancestor) => ancestor.data.item)
          .includes(activeId);
      })
      .filter((row) => {
        if (filterColumn == "all") {
          return Object.values(row).join(" ").includes(filterValue);
        } else {
          switch (filterValue.substring(0, 1)) {
            case "<":
              return (
                parseFloat(row[filterColumn]) <
                parseFloat(filterValue.substring(1))
              );
            case ">":
              return (
                parseFloat(row[filterColumn]) >
                parseFloat(filterValue.substring(1))
              );
            default:
              return row[filterColumn].includes(filterValue);
          }
        }
      })}
    on:click:cell={cellClicked}
    on:mouseenter:row={(row) => (currentRow = row)}
  >
    <Toolbar>
      <ToolbarBatchActions>
        <Select
          inline
          labelText="Download options"
          bind:selected={downloadTypeIndex}
        >
          {#each downloadTypes as { id, text }, i}
            <SelectItem value={i} {text} />
          {/each}
        </Select>
        <Button on:click={() => downloadBatch(tableFormattedDatabase.rows)}
          >Download selected (.zip)</Button
        >
      </ToolbarBatchActions>
      <ToolbarContent>
        <ToolbarSearch bind:value={filterValue} />
        <ToolbarMenu>
          <ToolbarMenuItem on:click={() => (filterColumn = "all")}>
            Search all columns
          </ToolbarMenuItem>
          {#each tableFormattedDatabase.headers as header}
            <ToolbarMenuItem on:click={() => (filterColumn = header.value)}>
              {header.value}
            </ToolbarMenuItem>
          {/each}
        </ToolbarMenu>
      </ToolbarContent>
    </Toolbar>
    <div slot="expanded-row" let:row>
      <Dropdown
        titleText="Download options"
        type="inline"
        bind:selectedIndex={downloadTypeIndex}
        items={downloadTypes}
      />
      <Button icon={Save16} on:click={download3dFile(row.item)} size="field"
        >Download</Button
      >
    </div>
  </DataTable>

  <ComposedModal size="lg" hasScrollingContent bind:open={modal3dViewOpen}>
    <ModalHeader>
      <h4>
        {"3D Viewer — " + modal3dViewItemId}
      </h4>
    </ModalHeader>
    <ModalBody>
      <Grid fullWidth noGutter>
        <Row>
          <Column>
            <iframe
              src={"data/iris/" + modal3dViewItemId + ".html"}
              frameborder="0"
              loading="lazy"
              allowfullscreen
              title={modal3dViewItemId}
              style="width: 100%; height: 72vh;"
            />
          </Column>
        </Row>
      </Grid>
    </ModalBody>
    <ModalFooter>
      <div slot="default">
        <Dropdown
          titleText="Download options"
          type="inline"
          direction="top"
          bind:selectedIndex={downloadTypeIndex}
          items={downloadTypes}
        />
        <Button icon={Save16} on:click={download3dFile(modal3dViewItemId)}
          >Download</Button
        >
      </div>
    </ModalFooter>
  </ComposedModal>
{/await}

<Modal
  bind:open={loadingOverlayOpen}
  modalHeading="Files download and conversion"
  passiveModal
  on:close={() => (loadingProgress = 0)}
>
  <ProgressBar
    value={loadingProgress}
    labelText={loadingFilename}
    helperText={Number.parseFloat(loadingProgress).toFixed(2) + " %"}
  />
</Modal>

<style>
  :global(.bx--parent-row) {
    cursor: pointer;
  }
</style>
