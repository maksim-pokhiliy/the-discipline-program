import ArticleOutlined from "@mui/icons-material/ArticleOutlined";
import ContactMailOutlined from "@mui/icons-material/ContactMailOutlined";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import FitnessCenterOutlined from "@mui/icons-material/FitnessCenterOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import PeopleOutlined from "@mui/icons-material/PeopleOutlined";
import StarBorderOutlined from "@mui/icons-material/StarBorderOutlined";
import WebOutlined from "@mui/icons-material/WebOutlined";

const icons = {
  dashboard: DashboardOutlined,
  products: Inventory2Outlined,
  reviews: StarBorderOutlined,
  blog: ArticleOutlined,
  pages: WebOutlined,
  contacts: ContactMailOutlined,
  exercises: FitnessCenterOutlined,
  users: PeopleOutlined,
} as const;

export type NavIconName = keyof typeof icons;

export const getNavIcon = (name: string) => {
  if (name in icons) {
    return icons[name as NavIconName];
  }

  return DashboardOutlined;
};
