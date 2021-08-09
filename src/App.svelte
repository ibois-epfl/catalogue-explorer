<script>
  import "carbon-components-svelte/css/all.css";

  import {
    Header,
    HeaderUtilities,
    HeaderAction,
    HeaderGlobalAction,
    HeaderPanelLinks,
    HeaderPanelDivider,
    HeaderPanelLink,
    SideNav,
    SideNavItems,
    SideNavMenu,
    SideNavMenuItem,
    SideNavLink,
    Content,
    Grid,
    Row,
    Column,
    Theme,
    TreeView,
  } from "carbon-components-svelte";

  import ColorSwitch24 from "carbon-icons-svelte/lib/ColorSwitch24";

  import Cat_DataTable from "./Cat_DataTable.svelte";

  import * as d3 from "d3";
  import Breadcrumb from "./Breadcrumb.svelte";

  let theme = "g80";
  function switchTheme() {
    theme = theme == "g80" ? "g10" : "g80";
  }

  let isSideNavOpen = true;
  let isOpen = false;

  let promDatabase = fetch("database.csv")
    .then((r) => r.text())
    .then((d) => d3.csvParse(d))
    .then((d) =>
      d3
        .stratify()
        .id((d) => d.item)
        .parentId((d) => d.parent)(d)
    );

  let promDatabaseLeaves = promDatabase.then((d) =>
    d.leaves().map((d) => d.data)
  );

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

  let modal3dViewOpen = false;
  let modal3dViewItemId = "";

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
      hashData.path = "root"
    }

    let pathArray = hashData.path ? hashData.path.split("/").filter((d) => d != "") : [];

    activeId = pathArray[pathArray.length - 1];
    console.log(pathArray[pathArray.length - 1])

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

  <Header company="IBOIS —" platformName="Irregular Components Catalogue">
    <HeaderUtilities>
      <HeaderGlobalAction
        aria-label="Theme switch"
        icon={ColorSwitch24}
        on:click={switchTheme}
      />
    </HeaderUtilities>
  </Header>

  <Content>
    <Grid>
      <Row>
        <Column>
          <h1>Welcome</h1>
        </Column>
      </Row>
    </Grid>
  </Content>
  <Grid padding>
    <Row>
      <Column sm={4} md={2} lg={4}>
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
      <Column sm={0} md={6} lg={12}>
          <Breadcrumb {breadcrumbData} />
        <Cat_DataTable {promDatabaseLeaves} />
      </Column>
    </Row>
  </Grid>
</main>
