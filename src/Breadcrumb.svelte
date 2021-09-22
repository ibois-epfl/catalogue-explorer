<!-- 
@author: Aymeric Broyet
@date: 20210921
 -->
 <script>
  // "#view=DataTable&path=/coucou/42/salopetteJaune"
  // {path: "/coucou/42/", view: "DataTable"}

  export let breadcrumbData

  import {
    Row,
    Column,
    Breadcrumb,
    BreadcrumbItem,
  } from "carbon-components-svelte";
</script>

<Row>
  <Column>
    <Breadcrumb>
      {#each breadcrumbData as item, i}
        <BreadcrumbItem
          href={item.href}
          isCurrentPage={i === breadcrumbData.length - 1}
        >
          {item.text}
        </BreadcrumbItem>
      {/each}
    </Breadcrumb>
  </Column>
</Row>
