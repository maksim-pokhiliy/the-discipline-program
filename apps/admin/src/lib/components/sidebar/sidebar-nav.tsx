import { Divider, List, Typography } from "@mui/material";

import { type AdminNavGroup } from "@repo/shared";

import { SidebarLink } from "./sidebar-link";

type SidebarNavProps = {
  groups: AdminNavGroup[];
  expanded: boolean;
};

export const SidebarNav = ({ groups, expanded }: SidebarNavProps) => {
  return (
    <>
      {groups.map((group, index) => (
        <List key={group.label} disablePadding>
          {expanded ? (
            <Typography
              variant="overline"
              component="div"
              sx={{
                px: 2.5,
                pt: index === 0 ? 1 : 2,
                pb: 1,
                color: "text.secondary",
              }}
            >
              {group.label}
            </Typography>
          ) : (
            index > 0 && <Divider sx={{ my: 1 }} />
          )}

          {group.links.map((link) => (
            <SidebarLink
              key={link.href}
              text={link.text}
              href={link.href}
              icon={link.icon}
              expanded={expanded}
            />
          ))}
        </List>
      ))}
    </>
  );
};
