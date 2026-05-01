import Navbar from "@/components/layout/Navbar";
import SubNav from "@/components/layout/SubNav";
import Footer from "@/components/layout/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <SubNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
