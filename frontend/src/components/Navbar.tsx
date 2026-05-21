import React from "react";
import { AppBar, Toolbar, Typography, Box, IconButton, ButtonBase } from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LocalFlorist as EcoIcon, ArrowBack as BackIcon } from "@mui/icons-material";

interface NavItem {
  label: string;
  to: string;
  match: (path: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/", match: (p) => p === "/" },
  { label: "Plants", to: "/plants", match: (p) => p === "/plants" || p.startsWith("/plant/") },
  { label: "Areas", to: "/areas", match: (p) => p === "/areas" || p.startsWith("/area/") },
  { label: "Strains", to: "/strains", match: (p) => p.startsWith("/strains") },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const showBack = location.pathname.startsWith("/plant/") || location.pathname.startsWith("/area/");

  return (
    <AppBar position="sticky" color="default">
      <Toolbar sx={{ gap: 1 }}>
        {showBack && (
          <IconButton
            onClick={() => navigate(-1)}
            size="small"
            sx={{ mr: 0.5 }}
            aria-label="Back"
          >
            <BackIcon />
          </IconButton>
        )}

        <Box
          component={Link}
          to="/"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            textDecoration: "none",
            color: "inherit",
            mr: 3,
          }}
        >
          <EcoIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            GrowFlow
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "stretch", flex: 1, height: 64 }}>
          {NAV_ITEMS.map((item) => {
            const active = item.match(location.pathname);
            return (
              <ButtonBase
                key={item.to}
                component={Link}
                to={item.to}
                sx={{
                  px: 2,
                  position: "relative",
                  color: active ? "text.primary" : "text.secondary",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  transition: "color 120ms ease",
                  "&:hover": { color: "text.primary" },
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    left: 16,
                    right: 16,
                    bottom: 0,
                    height: 2,
                    borderRadius: "2px 2px 0 0",
                    bgcolor: active ? "primary.main" : "transparent",
                    transition: "background-color 120ms ease",
                  },
                }}
              >
                {item.label}
              </ButtonBase>
            );
          })}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
