import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PercentIcon from "@mui/icons-material/Percent";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  Grid,
  Typography,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { BusinessStats } from "@repo/api";

import { ContentSection } from "@app/shared/components/ui/content-section";

import { StatsCard } from "../../components/stats-card";

interface BusinessStatsSectionProps {
  businessStats: BusinessStats;
}

export const BusinessStatsSection = ({ businessStats }: BusinessStatsSectionProps) => {
  return (
    <ContentSection title="Business Statistics">
      <Stack spacing={3}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="Total Revenue"
              value={`$${businessStats.revenue.total}`}
              subtitle={`This month: $${businessStats.revenue.thisMonth}`}
              icon={<AttachMoneyIcon fontSize="medium" />}
              color="success"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="Orders"
              value={businessStats.orders.total}
              subtitle={`${businessStats.orders.completed} completed, ${businessStats.orders.failed} failed`}
              icon={<ShoppingCartIcon fontSize="medium" />}
              color="primary"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="Average Order"
              value={`$${businessStats.averageOrderValue}`}
              subtitle="Per completed order"
              icon={<TrendingUpIcon fontSize="medium" />}
              color="primary"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="Conversion Rate"
              value={`${businessStats.conversionRate}%`}
              subtitle="From contacts to orders"
              icon={<PercentIcon fontSize="medium" />}
              color={businessStats.conversionRate > 5 ? "success" : "warning"}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Top Programs
                </Typography>

                {businessStats.topPrograms.length > 0 ? (
                  <Stack spacing={2}>
                    {businessStats.topPrograms.map((program, index) => (
                      <Stack
                        key={program.id}
                        direction="row"
                        sx={{
                          justifyContent: "space-between",
                          alignItems: "center",
                          p: 2,
                          backgroundColor: index === 0 ? "primary.main" : "background.default",
                          color: index === 0 ? "primary.contrastText" : "text.primary",
                        }}
                      >
                        <Stack>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {program.name}
                          </Typography>

                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {program.orderCount} orders
                          </Typography>
                        </Stack>

                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          ${program.revenue}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">No sales data yet</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Recent Orders
                </Typography>

                {businessStats.recentOrders.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Program</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {businessStats.recentOrders.slice(0, 5).map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <Stack>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {order.programName}
                                </Typography>

                                <Typography variant="caption" color="text.secondary">
                                  {order.customerEmail}
                                </Typography>
                              </Stack>
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2">${order.amount}</Typography>
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={order.status}
                                size="small"
                                color={
                                  order.status === "COMPLETED"
                                    ? "success"
                                    : order.status === "FAILED"
                                      ? "error"
                                      : "warning"
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">No orders yet</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </ContentSection>
  );
};
