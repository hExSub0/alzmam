import React from 'react'
import TopHeader from "./components/TopHeader";
import Header from "./components/Header";
import Banner from "./components/Banner";
import LatestProducts from "./components/LatestProducts";
import Footer from "./components/Footer";

const page = () => {
  return (
    <>
      <TopHeader />
      <Header />
      <Banner />
      <LatestProducts />
      <Footer />
    </>
  )
}

export default page
