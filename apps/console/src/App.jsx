import Layout from "./components/Layout"
import Catalog from "./features/catalog/Catalog"
import ActivityPanel from "./components/ActivityPanel"

export default function App(){

  return (

    <Layout>

      <div style={{
        display:"grid",
        gridTemplateColumns:"1fr 340px",
        gap:"40px"
      }}>

        <div>

          <h2 style={{
            marginBottom:"24px"
          }}>
            Architecture Marketplace
          </h2>

          <Catalog/>

        </div>

        <div style={{
          borderLeft:"1px solid #00FFB2",
          paddingLeft:"24px"
        }}>

          <h3 style={{marginBottom:"12px"}}>
            Trace Engine Activity
          </h3>

          <ActivityPanel/>

        </div>

      </div>

    </Layout>

  )

}
