
export default function Dashboard() {
    return (
        <>
            <section className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="w-full md:px-16 px-10 py-20 relative">
                    {/* Decorative elements */}
                    <div className="absolute top-10 left-10 w-32 h-32 bg-[#FD0C0B]/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#FD0C0B]/10 rounded-full blur-3xl"></div>

                    <div className="flex-col justify-center items-center gap-10 flex max-w-4xl mx-auto relative z-10">
                        <div className="flex-col justify-center items-center gap-10 flex">
                            <div className="flex-col justify-start items-center gap-2.5 flex">
                                <h2 className="text-center text-[#FD0C0B] md:text-8xl text-5xl font-bold font-serif leading-normal">
                                    Coming Soon!
                                </h2>
                                <p className="text-center text-gray-500 text-base font-normal leading-relaxed">
                                    Development is still ongoing...
                                </p>
                            </div>

                            {/* Add a progress indicator or loader */}
                            <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
                                <div className="w-1/8 h-full bg-[#FD0C0B] rounded-full"></div>
                            </div>
                            <p className="text-gray-500 text-sm">10% Complete</p>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}