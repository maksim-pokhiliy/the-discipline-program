import ArticleOutlined from "@mui/icons-material/ArticleOutlined";
import ContactMailOutlined from "@mui/icons-material/ContactMailOutlined";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import EventOutlined from "@mui/icons-material/EventOutlined";
import FitnessCenterOutlined from "@mui/icons-material/FitnessCenterOutlined";
import FunctionsOutlined from "@mui/icons-material/FunctionsOutlined";
import HandymanOutlined from "@mui/icons-material/HandymanOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import LabelOutlined from "@mui/icons-material/LabelOutlined";
import PeopleOutlined from "@mui/icons-material/PeopleOutlined";
import StarBorderOutlined from "@mui/icons-material/StarBorderOutlined";
import ViewModuleOutlined from "@mui/icons-material/ViewModuleOutlined";
import WebOutlined from "@mui/icons-material/WebOutlined";

const icons = {
  dashboard: DashboardOutlined,
  products: Inventory2Outlined,
  reviews: StarBorderOutlined,
  blog: ArticleOutlined,
  pages: WebOutlined,
  contacts: ContactMailOutlined,
  exercises: FitnessCenterOutlined,
  equipment: HandymanOutlined,
  labels: LabelOutlined,
  blockTypes: ViewModuleOutlined,
  schemeTypes: FunctionsOutlined,
  dayTypes: EventOutlined,
  users: PeopleOutlined,
} as const;

type NavIconName = keyof typeof icons;

const isNavIconName = (name: string): name is NavIconName => name in icons;

export const getNavIcon = (name: string) => {
  if (isNavIconName(name)) {
    return icons[name];
  }

  return DashboardOutlined;
};
