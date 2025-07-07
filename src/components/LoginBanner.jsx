import React from "react";

const LoginBanner = () => {
    return (
        <div className="bg w-1/2 h-[604px] rounded-3xl relative login-banner p-8">
          <div className="absolute left-0 top-0 w-full h-full bg-overlay rounded-3xl"></div>
          {/* <Image
            src="/Ellipse 11.png"
            width={50}
            height={50}
            alt=""
            className="absolute w-full h-full"
          />
          <Image
            src="/triangle-1.png"
            width={400}
            height={300}
            alt=""
            className="absolute left-[15%] top-[10%] triangle-1"
          />
          <Image
            src="/triangle-2.png"
            width={400}
            height={300}
            alt=""
            className="absolute bottom-[13%] right-[15%] triangle-2"
          /> */}
          <h2 className="text-2xl font-semibold text-white z-[9999]">Madison Jay</h2>
        </div>
    );
}

export default LoginBanner;