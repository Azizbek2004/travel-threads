import { Typography, Box } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

interface LogoProps {
  isMobileOrTablet?: boolean;
  asLink?: boolean;
}

const Logo = ({ isMobileOrTablet, asLink = true }: LogoProps) => {
  const content = (
    <>
      <img
        src="/logo.svg"
        alt=""
        height="36px"
        style={{ marginRight: "12px" }}
      />
      <Typography
        variant="h6"
        sx={{
          fontWeight: "bold",
          fontSize: isMobileOrTablet ? "1.1rem" : "1.2rem",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        Beyond Borders
      </Typography>
    </>
  );

  if (asLink) {
    return (
      <Box
        component={RouterLink}
        to="/"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
      }}
    >
      {content}
    </Box>
  );
};

export default Logo;
