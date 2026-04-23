import ArticleOutlined from "@mui/icons-material/ArticleOutlined";
import CategoryOutlined from "@mui/icons-material/CategoryOutlined";
import ContactMailOutlined from "@mui/icons-material/ContactMailOutlined";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import FitnessCenterOutlined from "@mui/icons-material/FitnessCenterOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import PeopleOutlined from "@mui/icons-material/PeopleOutlined";
import RuleOutlined from "@mui/icons-material/RuleOutlined";
import StarBorderOutlined from "@mui/icons-material/StarBorderOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import WebOutlined from "@mui/icons-material/WebOutlined";

const icons = {
  dashboard: DashboardOutlined,
  products: Inventory2Outlined,
  reviews: StarBorderOutlined,
  blog: ArticleOutlined,
  pages: WebOutlined,
  contacts: ContactMailOutlined,
  users: PeopleOutlined,
  "library-exercises": FitnessCenterOutlined,
  "library-review": RuleOutlined,
  "library-schemes": TuneOutlined,
  "library-block-types": CategoryOutlined,
} as const;

type NavIconName = keyof typeof icons;

const isNavIconName = (name: string): name is NavIconName => name in icons;

export const getNavIcon = (name: string) => {
  if (isNavIconName(name)) {
    return icons[name];
  }

  return DashboardOutlined;
};
