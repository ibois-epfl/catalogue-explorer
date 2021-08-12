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
    ComposedModal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Grid,
    Row,
    Column,
    Dropdown,
  } from "carbon-components-svelte";
  import Save16 from "carbon-icons-svelte/lib/Save16";

  import * as fflate from "fflate";
  import { saveAs } from "file-saver";

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

  let currentRow;

  function cellClicked() {
    console.log(currentRow);
    modal3dViewItemId = currentRow.detail.item;
    modal3dViewOpen = true;
  }
  let modal3dViewItemId = "";
  let modal3dViewOpen = false;

  let filterValue;
  let filterColumn = "all";

  let selectedRowIds = [];

  function downloadBatch(rows) {
    let filenames = selectedRowIds
      .map((id) => rows.filter((row) => row.id == id)[0])
      .map((row) => row.item + "_PointCloud.3dm");

    let urls = filenames.map((filename) => "data/3dm/" + filename);

    let fileBuffersProm = urls.map((url, index) => {
      return fetch(url)
        .then((res) => res.arrayBuffer())
        .then((fileBuffer) => [filenames[index], new Uint8Array(fileBuffer)]);
    });

    Promise.all(fileBuffersProm).then((fileBuffers) => {
      saveAs(
        new Blob(
          [fflate.zipSync(Object.fromEntries(fileBuffers), { level: 0 })],
          { type: "application/zip" }
        ),
        "point_cloud_selection.zip"
      );
    });
  }

  let downloadTypeIndex = 0;
  let downloadTypes = [
    { id: "_PointCloud.3dm", text: "Point cloud (original)" },
    {
      id: "_PointCloud_Downsampled.3dm",
      text: "Point cloud (voxel downsampled)",
    },
    { id: "_MinBBox.3dm", text: "MVBB (Minimal Volume Bounding Box)" },
    { id: "_Mesh.3dm", text: "Mesh (Poisson reconstruction)" },
  ];

  function download3dFile(id) {
    saveAs(
      "data/3dm/" + id + downloadTypes[downloadTypeIndex].id,
      id + downloadTypes[downloadTypeIndex].id
    );
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
        <Button
          icon={Save16}
          on:click={() => downloadBatch(tableFormattedDatabase.rows)}
          >Download original point clouds (.zip)</Button
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

<style>
  :global(.bx--parent-row) {
    cursor: pointer;
  }
</style>
