import React from "react";
import SvgIcon from "@mui/material/SvgIcon";
import DuckIcon from "./DuckIcon";

export default function Brand(props) {
  return (
    <SvgIcon
      {...props}
      viewBox="0 0 300 70"
      sx={{ width: 160, height: 60, ...props.sx }}
    >
      {/* Duck head */}
      <DuckIcon x="0" y="0" width="70" height="70" />

      {/* Brand text */}
      <text
        x="75"
        y="45"
        fontFamily="Poppins, sans-serif"
        fontSize="32"
        fontWeight="600"
        fill="#e78310"
      >
        Sous
      </text>
      <text
        x="155"
        y="45"
        fontFamily="Poppins, sans-serif"
        fontSize="32"
        fontWeight="600"
        fill="#e78310"
      >
        Duckling
      </text>
    </SvgIcon>
  );
}
