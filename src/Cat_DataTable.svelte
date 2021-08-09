<script>
  export let promDatabaseLeaves;

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
    Grid,
    Row,
    Column,
  } from "carbon-components-svelte";
  import Save16 from "carbon-icons-svelte/lib/Save16";

  let promTableFormattedDatabase = promDatabaseLeaves.then((d) => {
    let headers = Object.keys(d[0]).map((i) => {
      return { key: i, value: i };
    });
    let rows = d.map((i, index) => {
      i.id = index;
      return i;
    });
    let out = { headers: headers, rows: rows };
    console.log(out);

    return out;
  });

  function cellClicked(cell) {
    modal3dViewItemId = cell.detail.value;
    console.log(modal3dViewItemId);
    modal3dViewOpen = true;
  }
  let modal3dViewItemId = "";
  let modal3dViewOpen = false;

  let filterValue;
  let filterColumn = "all";
  // $: filteredTableFormattedDatabase = filterTable(tableFormattedDatabase, filterValue, filterColumn)
  // function filterTable(tableFormattedDatabase, filterValue, filterColumn) {
  //   console.log(tableFormattedDatabase)
  // }
</script>

{#await promTableFormattedDatabase}
  Loading ...
{:then tableFormattedDatabase}
  <DataTable
    title="DataTable view"
    description="Lists all the objects contained in database."
    sortable
    batchSelection
    headers={tableFormattedDatabase.headers}
    rows={tableFormattedDatabase.rows.filter((row) => {
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
  >
    <Toolbar>
      <ToolbarBatchActions>
        <Button icon={Save16}>Save</Button>
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
  </DataTable>

  <Modal
    passiveModal
    size="lg"
    bind:open={modal3dViewOpen}
    modalHeading={"3D Viewer — " + modal3dViewItemId}
    on:open
    on:close
    on:submit
  >
    <Grid fullWidth noGutter>
      <Row>
        <Column sm={4} md={5} lg={12}>
          <iframe
            src={"iris/" + modal3dViewItemId + ".html"}
            frameborder="0"
            title={modal3dViewItemId}
            style="width: max(100%); height: 80vh;"
          />
        </Column>
        <Column sm={0} md={3} lg={4}>
          <DataTable
            headers={[
              { key: "name", value: "Name" },
              { key: "protocol", value: "Protocol" },
              { key: "port", value: "Port" },
              { key: "rule", value: "Rule" },
            ]}
            rows={[
              {
                id: "a",
                name: "Load Balancer 3",
                protocol: "HTTP",
                port: 3000,
                rule: "Round robin",
              },
              {
                id: "b",
                name: "Load Balancer 1",
                protocol: "HTTP",
                port: 443,
                rule: "Round robin",
              },
              {
                id: "c",
                name: "Load Balancer 2",
                protocol: "HTTP",
                port: 80,
                rule: "DNS delegation",
              },
              {
                id: "d",
                name: "Load Balancer 6",
                protocol: "HTTP",
                port: 3000,
                rule: "Round robin",
              },
              {
                id: "e",
                name: "Load Balancer 4",
                protocol: "HTTP",
                port: 443,
                rule: "Round robin",
              },
              {
                id: "f",
                name: "Load Balancer 5",
                protocol: "HTTP",
                port: 80,
                rule: "DNS delegation",
              },
            ]}
          />
        </Column>
      </Row>
    </Grid>
  </Modal>
{/await}

<!--     style="width: {parseInt(window.innerWidth * .9).toString() + "px"}; height: {parseInt(window.innerHeight * .9).toString() + "px"};"
 -->
