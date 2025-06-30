import React, { useEffect, useState } from "react";
import axiosInstance from '../../axiosInstance/axiosWithAuth';
import moment from "moment-jalaali";
import dayjs from "dayjs";
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Fade,
  IconButton,
  Stack
} from '@mui/material';
import { CheckCircle, AddCircleOutline } from '@mui/icons-material';
import FastfoodIcon from '@mui/icons-material/FastfoodTwoTone';
import convertToPersian from '../../assets/Converter/ConvertToPersian';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import keycloak from '../../keyclaok/keycloak';
import holidays from '../../api/holidayApi.json';
import { useWallet } from "../../context/WalletContext";

moment.loadPersian({ dialect: 'persian-modern' });

function getStartOfWeek(date) {
    const dayOfWeek = date.day();
    const diff = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
    return date.clone().subtract(diff, 'days').startOf('day');
}

const getHolidayName = (date) => {
    const d = dayjs.isDayjs(date) ? date : dayjs(date);
    const greg = d.format('YYYY-MM-DD');
    const formatted = moment(greg, 'YYYY-MM-DD').format('jYYYY-jMM-jDD');
    const h = holidays.find(h => h.date === formatted);
    return h ? h.name : null;
};

export default function ChooseFood() {
    const userId = keycloak.tokenParsed.sub;
    const [weekStart, setWeekStart] = useState(() => getStartOfWeek(moment()));
    const [menuData, setMenuData] = useState([]);
    const [allMenuData, setAllMenuData] = useState([]);
    const [selected, setSelected] = useState({});      
    const [reservedMap, setReservedMap] = useState({}); 
    const [guestCount, setGuestCount] = useState({});
    const [loading, setLoading] = useState(false);
    const { fetchWalletBalance } = useWallet();

    const increaseGuestCount = (date) => {
        setGuestCount(prev => {
            const current = prev[date] || 0;
            if (current >= 3) {
                toast.info('حداکثر تعداد غذای مهمان ۳ عدد است.');
                return prev;
            }
            return { ...prev, [date]: current + 1 };
        });
    };

    const decreaseGuestCount = (date) => {
        setGuestCount(prev => ({ ...prev, [date]: Math.max((prev[date] || 0) - 1, 0) }));
    };

    const fetchMenu = async (start) => {
        const fromDate = start.format('YYYY-MM-DD');
        const toDate = start.clone().add(5, 'days').format('YYYY-MM-DD');
        try {
            const response = await axiosInstance.get(
                ` {Lunch_Service_Address}/api/KitchenMenu/GetKitchenMenu?fromDate=${fromDate}&toDate=${toDate}`
            );
            const payload = response.data;
            const resultArr = Array.isArray(payload.result)
                ? payload.result
                : Array.isArray(payload.data)
                ? payload.data
                : Array.isArray(payload)
                ? payload
                : [];
            setMenuData(resultArr);
            setAllMenuData(prev => {
                const newDates = resultArr.map(item => item.date.slice(0,10));
                const filtered = prev.filter(item => !newDates.includes(item.date.slice(0,10)));
                return [...filtered, ...resultArr];
            });
            fetchReserved(fromDate, toDate, resultArr);
        } catch (err) {
            console.error('خطا در دریافت منو:', err);
            setMenuData([]);
        }
    };

    const fetchReserved = (from, to) => {
      
        const fromISO = new Date(from).toISOString();
        const toISO = new Date(to).toISOString();
      
        const url = ` {Lunch_Service_Address}/api/UserChoice/GetUserchoiceByUserIdDate?fromDate=${fromISO}&ToDate=${toISO}&userId=${userId}`;
      
        fetch(url)
          .then(res => {
            if (!res.ok) throw new Error("خطا در پاسخ");
            return res.json();
          })
          .then(data => {
            //console.log("داده دریافتی:", data);
            const choices = Array.isArray(data.result) ? data.result : [];
            const map = {};

            choices.forEach(item => {
                const dateKey = item.kitchenMenu?.date?.slice(0, 10);
                const foodId = item.kitchenMenu?.food?.id;
        
                if (dateKey && foodId) {
                    if (!map[dateKey]) map[dateKey] = [];
                    map[dateKey].push(foodId);
                }
            });
      
            setReservedMap(map);
          })
        .catch(err => console.error("خطا:", err));
    };      

    useEffect(() => {
        fetchMenu(weekStart);
    }, [weekStart]);

    const grouped = allMenuData.reduce((acc, item) => {
        const key = item.date.slice(0,10);
        if (!acc[key]) acc[key] = [];
        if (item.food) acc[key].push(item.food);
        return acc;
    }, {});

    const prevWeek = () => setWeekStart(w => w.clone().subtract(7, 'days'));
    const nextWeek = () => setWeekStart(w => w.clone().add(7, 'days'));

    const handleSelect = (dayIndex, idx) => {
        const dateKey = weekStart.clone().add(dayIndex, 'days').format('YYYY-MM-DD');
        const isPastOrToday = moment().isSameOrAfter(dateKey, 'day');
        const alreadyReserved = Array.isArray(reservedMap[dateKey]) && reservedMap[dateKey].length > 0;
        if (isPastOrToday || alreadyReserved) return;
        setSelected(prev => {
        const curr = prev[dateKey] || [];
        return curr.includes(idx)
            ? { ...prev, [dateKey]: [] }
            : { ...prev, [dateKey]: [idx] };
        });
    };

    const anySelected = Object.values(selected).some(arr => arr.length > 0);

    const summary = Object.entries(selected)
        .filter(([date, arr]) => arr.length > 0)
        .map(([date, arr]) => ({
        date,
        foods: (grouped[date] || []).filter((_, i) => arr.includes(i))
        }))
        .sort((a, b) => moment(a.date).diff(moment(b.date)));

    const handleSubmit = async () => {
        setLoading(true);
        const floor = keycloak.tokenParsed.Floor;
        const comment = "---";
        
        const requests = summary.map(({ date, foods }) => {
            const menu = menuData.find(item => item.date.slice(0,10) === date);
            const count = (guestCount[date] || 0) + 1;
            return foods[0] && menu
            ? { userId, comment, floor, kitchenMenuId: menu.id, count }
            : null;
        }).filter(r => r);
        
        if (!requests.length) {
            toast.warn("هیچ انتخابی برای ثبت وجود ندارد.");
            setLoading(false);
            return;
        }
        
        const totalAmount = summary.reduce((sum, { date, foods }) => {
            const price = foods[0]?.price || 0;
            const count = (guestCount[date] || 0) + 1;
            return sum + price * count;
        }, 0);
        
        const createFinance = async (action) => {
            const financePayload = new URLSearchParams();
            financePayload.append('wallet_uuid', keycloak.tokenParsed.WalletId);
            financePayload.append('action', action); // 'deduct' or 'stack'
            financePayload.append('amount', totalAmount.toString());
            const dueValue = action === 'stack' ? 'amendment' : 'lunch';
            financePayload.append('due', dueValue);
        
            return axiosInstance.post(
                ' {Wallet_Service_Address}/api/finance/transaction/',
                financePayload.toString(),
                { headers: { Authorization: `Bearer ${keycloak.token}` } }
            );
        };
        
        try {
                const financeRes = await createFinance('deduct');
                if (!financeRes.status || financeRes.status >= 400) {
                    throw new Error('تراکنش مالی ناموفق بود؛ لطفاً مجدداً تلاش کنید.');
            }
        
            try {
                await axiosInstance.post(
                    ' {Lunch_Service_Address}/api/UserChoice/AddRangeUserChoice',
                    requests,
                    { headers: { Authorization: `Bearer ${keycloak.token}` } }
                );
            } catch (foodError) {
                await createFinance('stack');
                throw new Error('ثبت غذا با خطا مواجه شد، تراکنش اصلاح شد.');
            }
        
            await fetchWalletBalance();
            setSelected({});
            const from = weekStart.format('YYYY-MM-DD');
            const to   = weekStart.clone().add(5,'days').format('YYYY-MM-DD');
            fetchReserved(from, to, menuData);
        
            toast.success('تراکنش انجام شد و غذا با موفقیت ثبت گردید.');
        } catch (err) {
            console.error('خطا:', err);
            toast.error(err.response.data.detail || 'خطا در تراکنش یا ثبت غذا');
        } finally {
            setLoading(false);
        }
    };                   

    return (
        <Box p={4} flex={5}>
            <ToastContainer position="bottom-right" rtl />
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Button variant="outlined" onClick={prevWeek}>{'< هفته قبل'}</Button>
                <Typography sx={{ fontSize: { xs: '12px', sm: '14px' }, fontWeight: 'bold' }}>
                    برنامه غذایی هفته
                </Typography>
                <Button variant="outlined" onClick={nextWeek}>{'هفته بعد >'}</Button>
            </Box>

            <Grid container spacing={2} justifyContent="right">
                {Array.from({ length: 6 }).map((_, dayIndex) => {
                    const date = weekStart.clone().add(dayIndex, 'days');
                    const key = date.format('YYYY-MM-DD');
                    const diffDays = date.startOf('day').diff(dayjs().startOf('day'), 'day');
                    const foods = grouped[key] || [];
                    const isPast = date.isBefore(moment(), 'day');
                    const holidayName = getHolidayName(date);
                    const isToday = date.isSame(moment(), 'day');
                    const count = guestCount[key] || 0;

                    return (
                        <Grid item xs={6} sm={6} md={4} lg={2} key={key}>
                            <Card
                                sx={{ display: 'flex', flexDirection: 'column', height: '100%',
                                    pointerEvents: (isPast || isToday || diffDays === 1 || holidayName || foods.length === 0) ? 'none' : 'auto',
                                    opacity: (isPast || isToday || diffDays === 1 || holidayName || foods.length === 0) ? 0.5 : 1,
                                    backgroundColor: isToday ? '#e3f2fd' : 'inherit'
                                }}
                            >
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: holidayName ? 'red' : '#006BD6' }}>
                                        {date.locale('fa').format('dddd')}
                                    </Typography>
                                    <Typography variant="body2">
                                        {convertToPersian(date.format('jYYYY/jM/jD'))}
                                    </Typography>
                                </CardContent>
                                <CardContent sx={{ flexGrow: 1, p: 1 }}>
                                    <Stack spacing={1}>
                                        {foods.length > 0 ? foods.map((food, idx) => {
                                            const selIdx = selected[key] || [];
                                            const isSel = selIdx.includes(idx);
                                            const reservedIds = reservedMap[key] || [];
                                            const isRes = reservedIds.includes(food.id);
                                            const isChosen = isSel || isRes;
                                            return (
                                                <Fade in key={food.id}>
                                                    <Box sx={{ position: 'relative', borderRadius: 2, border: isChosen ? '2px solid green' : '1px solid #ccc' }}>
                                                        <CardMedia component="img" height="100" image={food.foodImage} alt={food.name} sx={{ objectFit: 'cover' }} />
                                                        <Box p={1}>
                                                            <Typography sx={{ fontSize: '12px', fontWeight: 'bold' }}>{food.name}</Typography>
                                                            <Typography variant="caption">{convertToPersian(food.price.toLocaleString())} ریال</Typography>
                                                        </Box>
                                                        <IconButton onClick={() => handleSelect(dayIndex, idx)} disabled={isPast || isToday || isRes || diffDays === 1}
                                                            sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'white', borderRadius: '50%' }}>
                                                            {isChosen ? <CheckCircle color="success" /> : <AddCircleOutline color="action" />}
                                                        </IconButton>
                                                        {diffDays >= 2 && !isRes && (
                                                            <Box mt={1} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#f9f9f9', padding: '4px', margin:'4px' }}>
                                                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                                    <Typography sx={{ fontSize: { xs: '10px', sm: '12px' }, fontWeight: 'bold' }}>غذای مهمان</Typography>
                                                                    <Stack direction="row" alignItems="center">
                                                                        <IconButton 
                                                                            size="small" 
                                                                            onClick={() => decreaseGuestCount(key)} 
                                                                            sx={{ bgcolor: '#e0e0e0', '&:hover': { bgcolor: '#d5d5d5' }, width: 22, height: 22 }}
                                                                        >
                                                                            –
                                                                        </IconButton>
                                                                        <Typography 
                                                                            sx={{ textAlign: 'center', fontSize: { xs: '12px', sm: '14px' }, fontWeight: 'bold', borderRadius: 1, py: 0.5, px: { xs: 0.5, sm: 1 } }}
                                                                        >
                                                                            {count}
                                                                        </Typography>
                                                                        <IconButton 
                                                                            size="small" 
                                                                            onClick={() => increaseGuestCount(key)} 
                                                                            disabled={guestCount[food.date] >= 3}
                                                                            sx={{
                                                                                bgcolor: guestCount[food.date] >= 3 ? '#f0f0f0' : '#e0e0e0',
                                                                                '&:hover': { bgcolor: guestCount[food.date] >= 3 ? '#f0f0f0' : '#d5d5d5' },
                                                                                width: 22,
                                                                                height: 22
                                                                            }}
                                                                        >
                                                                            +
                                                                        </IconButton>
                                                                    </Stack>
                                                                </Stack>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Fade>
                                            );
                                        }) : (
                                        <Typography variant="body2" sx={{ color: holidayName ? 'red' : 'text.secondary' }} align="center">
                                            {holidayName ? holidayName : 'غذایی برای این روز موجود نیست'}
                                        </Typography>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {anySelected && summary.length > 0 && (
                <Box mt={4} p={3} bgcolor="#f7f7f7" borderRadius={2} boxShadow={2}>
                    <Typography gutterBottom><FastfoodIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: '14px' }} /> خلاصه انتخاب‌ها</Typography>
                    <ul>
                        {summary.map(({ date, foods }) => {
                            const m = moment(date).locale('fa');
                            const persianDay = m.format('dddd');
                            const formattedDate = convertToPersian(m.format('jD jMMMM jYYYY'));
                            const count = guestCount[date] || 0;
                            return (
                                <li key={date} style={{ marginBottom: 8 }}>
                                    <Typography component="span" sx={{ fontSize: {xs:'12px',sm:'14px'}, fontWeight: 'bold' }}>
                                        {persianDay}، {formattedDate}:
                                    </Typography>
                                    <span style={{ marginRight: 8 }}>
                                        {foods.map((f, i) => (
                                            <Typography key={f.id} component="span" sx={{ fontSize: {xs:'12px',sm:'14px'}, fontWeight: 'bold', mr: i < foods.length - 1 ? 1 : 0 }}>{f.name}{count>0&&` (مهمان: ${convertToPersian(count)})`}{i<foods.length-1?'، ':''}</Typography>
                                        ))}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                    <Button variant="contained" color="success" fullWidth disabled={!anySelected || loading} onClick={handleSubmit}>
                        {loading ? 'لطفا منتظر بمانید' : 'تایید و ثبت'}
                    </Button>
                </Box>
            )}
        </Box>
    );
}
