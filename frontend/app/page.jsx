import React from 'react'
import TopHeader from "./components/TopHeader";
import Header from "./components/Header";
import Banner from "./components/Banner";
import ProductSections from "./components/ProductSections";
import Footer from "./components/Footer";

const page = () => {
  return (
    <>
      <TopHeader />
      <Header />
      <Banner />
      <ProductSections />
      <Footer />
    </>
  )
}

export default page
