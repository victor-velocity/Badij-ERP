import React from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBus, faFirstAid, faGlobe, faMoneyBill } from "@fortawesome/free-solid-svg-icons";
import { faBarChart, faNoteSticky } from "@fortawesome/free-regular-svg-icons";

const LoginBanner = () => {
  return (
    <div className="bg-[#b88b1b] w-1/2 h-[604px] rounded-3xl relative login-banner p-8"> 
      <Image
        src="/Ellipse 11.png"
        alt="Ellipse 11"
        width={50}
        height={50}
        className="absolute w-full h-full left-0 right-0"
      />
      <Image
        src="/triangle-1.png"
        width={400}
        height={300}
        alt="triangle-1"
        className="absolute left-[15%] top-[10%] triangle-1"
      />
      <Image
        src="/triangle-2.png"
        width={400}
        height={300}
        alt="triangle-2"
        className="absolute bottom-[13%] right-[15%] triangle-2"
      />
      <Image
        src="/madisonjayng_logo.png"
        width={200}
        height={50}
        alt="madisonjayng_logo"
        className="absolute madison-logo right-[50%] bottom-[57%] left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[9999] white-effect"
      />
      <Image
        src="/login-img-01.png"
        alt="login-img-01 "
        width={80}
        height={100}
        className="absolute left-[25%] top-[20%] translate-x-[-50%] translate-y-[-50%] login-img-01"
      />
      <div className="absolute top-[3%] bg-white p-2 rounded-[7px] max-w-[220px] flex items-center gap-2 login-div-01">
        <FontAwesomeIcon icon={faBus} className="text-[#A09D9D] bg-[#F9F7F7] p-[7px] rounded-full text-2xl login-icon" />
        <p className="text-[#A09D9D] text-[11px] text-justify login-content">New vehicle and company asset <br /> has been assigned successfully</p>
      </div>
      <Image
        src="/login-img-02.png"
        alt="login-img-02"
        width={80}
        height={100}
        className="absolute right-[10%] top-[20%] translate-x-[-50%] translate-y-[-50%] login-img-02"
      />
      <div className="absolute top-[3%] right-[5%] bg-white p-2 rounded-[7px] max-w-[240px] flex items-center gap-2 login-div-02">
        <FontAwesomeIcon icon={faBarChart} className="text-[#A09D9D] bg-[#F9F7F7] p-[7px] rounded-full text-2xl login-icon" />
        <p className="text-[#A09D9D] text-[11px] text-justify login-content">Performance evaluation has been <br /> scheduled</p>
      </div>
      <Image
        src="/login-img-03.png"
        alt="login-img-03"
        width={80}
        height={100}
        className="absolute left-[14%] top-[50%] bottom-[50%] translate-x-[-50%] translate-y-[-55%] login-img-03"
      />
      <div className="absolute top-[33%] left-[2%] bg-white p-2 rounded-[7px] max-w-[240px] flex items-center gap-2 login-div-03">
        <FontAwesomeIcon icon={faMoneyBill} className="text-[#A09D9D] bg-[#F9F7F7] p-[7px] rounded-full text-2xl login-icon" />
        <p className="text-[#A09D9D] text-[11px] text-justify login-content">Payroll cycle closed <br /> successfully</p>
      </div>
      <Image
        src="/login-img-04.png"
        alt="login-img-04"
        width={80}
        height={100}
        className="absolute right-[1%] top-[50%] bottom-[50%] translate-x-[-50%] translate-y-[-64%] login-img-04"
      />
      <div className="absolute top-[32%] right-[2%] bg-white p-2 rounded-[7px] max-w-[240px] flex items-center gap-2 login-div-04">
        <FontAwesomeIcon icon={faFirstAid} className="text-[#A09D9D] bg-[#F9F7F7] p-[7px] rounded-full text-2xl login-icon" />
        <p className="text-[#A09D9D] text-[11px] text-justify login-content">Medical insurance option <br /> has been activated</p>
      </div>
      <Image
        src="/login-img-05.png"
        alt="login-img-05"
        width={80}
        height={100}
        className="absolute left-[25%] bottom-[7%] translate-x-[-50%] translate-y-[-50%] login-img-05"
      />
      <div className="absolute bottom-[28%] left-[2%] bg-white p-2 rounded-[7px] max-w-[240px] flex items-center gap-2 login-div-05">
        <FontAwesomeIcon icon={faNoteSticky} className="text-[#A09D9D] bg-[#F9F7F7] p-[7px] rounded-full text-2xl login-icon" />
        <p className="text-[#A09D9D] text-[11px] text-justify login-content">Product invoice successfully <br /> generated and sent</p>
      </div>
      <Image
        src="/login-img-06.png"
        alt="login-img-06"
        width={80}
        height={100}
        className="absolute right-[10%] bottom-[8%] translate-x-[-50%] translate-y-[-50%] login-img-06"
      />
      <div className="absolute bottom-[28%] right-[2%] bg-white p-2 rounded-[7px] max-w-[240px] flex items-center gap-2 login-div-06">
        <FontAwesomeIcon icon={faGlobe} className="text-[#A09D9D] bg-[#F9F7F7] p-[7px] rounded-full text-2xl login-icon" />
        <p className="text-[#A09D9D] text-[11px] text-justify login-content">Travel leave request approved</p>
      </div>
      <h2 className="absolute bottom-[4%] whitespace-nowrap translate-x-1/2 right-1/2 text-white font-semibold text-xl">Building Great Workplaces Together</h2>
    </div>
  );
}

export default LoginBanner;