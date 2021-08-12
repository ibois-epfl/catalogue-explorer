<script>
  import "carbon-components-svelte/css/all.css";

  import {
    Header,
    HeaderUtilities,
    HeaderGlobalAction,
    Content,
    Grid,
    Row,
    Column,
    Theme,
    TreeView,
    Accordion,
    AccordionItem,
    UnorderedList,
    ListItem,
  } from "carbon-components-svelte";

  import ColorSwitch24 from "carbon-icons-svelte/lib/ColorSwitch24";

  import Cat_DataTable from "./Cat_DataTable.svelte";

  import * as d3 from "d3";
  import Breadcrumb from "./Breadcrumb.svelte";

  let theme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "g90"
    : "g10";
  console.log(window.matchMedia("(prefers-color-scheme: dark)"));
  function switchTheme() {
    theme = theme == "g90" ? "g10" : "g90";
  }

  let promDatabase = fetch("data/database.csv")
    .then((r) => r.text())
    .then((d) => d3.csvParse(d))
    .then((d) =>
      d3
        .stratify()
        .id((d) => d.item)
        .parentId((d) => d.parent)(d)
    );

  let promDatabaseLeaves = promDatabase.then((d) => {
    let leaves = d.leaves();
    let leavesData = leaves.map((d) => d.data);
    return {
      leaves: leaves,
      leavesData: leavesData,
    };
  });

  let activeId = "root";
  let selectedIds = ["root"];
  let expandedIds = [];
  let promDatabaseTreeview = promDatabase
    .then((d) =>
      d.eachBefore((d) => {
        expandedIds.push(d.id);
        d.text = d.data.item;
        let newLeaf = false;
        d.children.forEach((e) => {
          if (e.children == undefined) {
            newLeaf = true;
          }
        });
        if (newLeaf) {
          delete d.children;
        }
      })
    )
    .then((d) => [d]);

  // History navigation //////////

  let hashData, breadcrumbData, hashSubStrings;

  hashUpdate();

  function hashUpdate() {
    hashSubStrings = window.location.hash
      .replace("#", "")
      .split("&")
      .filter((d) => d != "");

    hashData = Object.fromEntries(
      new Map(hashSubStrings.map((d) => d.split("=")))
    );

    if (hashData.path == undefined) {
      hashData.path = "root";
    }

    let pathArray = hashData.path
      ? hashData.path.split("/").filter((d) => d != "")
      : [];

    activeId = pathArray[pathArray.length - 1];

    function newHash(hashData) {
      let values = Object.values(hashData);
      let keys = Object.keys(hashData);
      return (
        "#" + keys.map((key, index) => key + "=" + values[index]).join("&")
      );
    }

    breadcrumbData = pathArray.map((item, index) => {
      let newHashData = {};
      Object.assign(newHashData, hashData);
      newHashData.path = pathArray.slice(0, index + 1).join("/");
      let text = pathArray[index];
      return { href: newHash(newHashData), text: text };
    });
  }

  window.onhashchange = hashUpdate;
</script>

<main>
  <Theme bind:theme persist persistKey="__carbon-theme" />

  <Header company="EPFL IBOIS —" platformName="Catalogue Explorer">
    <HeaderUtilities>
      <HeaderGlobalAction
        aria-label="Theme switch"
        icon={ColorSwitch24}
        on:click={switchTheme}
      />
    </HeaderUtilities>
  </Header>

  <Content>
    <Breadcrumb {breadcrumbData} />
  </Content>
  <Grid padding fullWidth>
    <Row>
      <Column sm={4} md={2} lg={3}>
        <Accordion>
          <AccordionItem title="How to ?">
            <UnorderedList nested>
              <ListItem>
                Clicking on a row opens a window with the object's 3d viewer.
              </ListItem>
              <ListItem>
                The table is sortable by clicking on column headers.
              </ListItem>
              <ListItem>
                Table content can be filtered by navigating the tree on the
                left.
              </ListItem>
              <ListItem>
                Further filtering is possible using the toolbar just below.
                Filtering works by text matching or by defining a maximum or
                minimum value using the syntaxes '&lt;x' or '&gt;x'
                respectively. You can restrict the filter to a specified column.
              </ListItem>
              <ListItem>
                Clicking on the down arrow in front of a row opens 3D file
                download options for the given object.
              </ListItem>
              <ListItem>
                Download of 3D files is also available from the 3D Viewer page.
              </ListItem>
              <ListItem>
                Selecting items in the table allows you to batch download them
                as a compressed folder.
              </ListItem>
            </UnorderedList>
          </AccordionItem>
        </Accordion>
        <br>
        {#await promDatabaseTreeview}
          <p>Loading ...</p>
        {:then database}
          <TreeView
            style="cursor: pointer;"
            hideLabel
            children={database}
            bind:activeId
            bind:selectedIds
            bind:expandedIds
            on:select={({ detail }) => {
              database[0].each((d) => {
                if (d.id == detail.id) {
                  let path = d
                    .ancestors()
                    .reverse()
                    .map((i) => i.id);
                  window.location = "#path=" + path.join("/");
                }
              });
            }}
          />
        {/await}
      </Column>
      <Column sm={4} md={6} lg={13}>
        <Cat_DataTable {promDatabaseLeaves} {activeId} />
      </Column>
    </Row>
  </Grid>
</main>
