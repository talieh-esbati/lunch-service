import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    FormControl,
    Autocomplete,
    TextField,
} from '@mui/material';
import holidays from '../../api/holidayApi.json';
import convertToPersian from '../../assets/Converter/ConvertToPersian';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import useRoles from '../../hooks/useRoles';
import dayjs from 'dayjs';
import jalali from 'jalali-dayjs';
import moment from 'moment-jalaali';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
moment.loadPersian({ dialect: 'persian-modern' });
dayjs.extend(jalali);

const AddMenu = () => {
    const [menu, setMenu] = useState([]);
    const [foodList, setFoodList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [existingItems, setExistingItems] = useState([]);
    const [currentMonthDate, setCurrentMonthDate] = useState(moment().startOf('jMonth'));
    const { hasRole } = useRoles();

    const isHoliday = (date) => {
        const formatted = moment(date, 'YYYY-MM-DD').format('jYYYY-jMM-jDD');
        const h = holidays.find(h => h.date === formatted);
        return h ? h.name : null;
    };

    const generateCalendarGrid = (monthDate) => {
        const start = monthDate.clone().startOf('jMonth');
        const end = monthDate.clone().endOf('jMonth');
   
        const firstWeekday = start.day(); 
        const blanks = firstWeekday === 5
            ? 0
            : firstWeekday === 6
            ? 0
            : firstWeekday + 1;
   
        const grid = [];
        for (let i = 0; i < blanks; i++) {
            grid.push({ blank: true });
        }
   
        let current = start.clone();
        while (current.isSameOrBefore(end, 'day')) {
            grid.push({
                blank: false,
                date: current.format('YYYY-MM-DD'),
            });
            current = current.add(1, 'day');
        }
        return grid;
    };

    // دریافت داده‌های غذاها
    const fetchListData = async () => {
        try {
            const response = await fetch(' {Lunch_Service_Address}/api/Food/GetAllFoods');
            const data = await response.json();
            setFoodList(data.result);
        } catch (error) {
            console.error('Error:', error);
            alert('خطا در دریافت لیست غذاها');
        }
    };

    // دریافت داده‌های منو برای ماه جاری با ساختار تقویم
    const fetchMenuData = async (monthDate = currentMonthDate) => {
        setLoading(true);
        const startOfJ = monthDate.clone().startOf('jMonth');
        const endOfJ = monthDate.clone().endOf('jMonth');
        const fromDate = startOfJ.format('YYYY-MM-DD');
        const toDate = endOfJ.format('YYYY-MM-DD');

        try {
            const response = await fetch(` {Lunch_Service_Address}/api/KitchenMenu/GetKitchenMenu?fromDate=${fromDate}&toDate=${toDate}`);
            const data = await response.json();

            const mappedExisting = data.result.map(item => ({
                id: item.id,
                date: item.date.split('T')[0],
                foodObj: item.food,
            }));
            setExistingItems(mappedExisting);

            const grid = generateCalendarGrid(monthDate);
            const merged = grid.map(day => {
                if (day.blank) return day;
                const ex = mappedExisting.find(e => e.date === day.date);
                return {
                    ...day,
                    id: ex?.id ?? 0,
                    food: ex ? ex.foodObj : null,
                };
            });
            setMenu(merged);
        } catch (error) {
            console.error('Error:', error);
            alert('خطا در دریافت منو');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListData();
        fetchMenuData();
    }, [currentMonthDate]);

    const handleChangeFood = (index, _, value) => {
        const updated = [...menu];
        updated[index].food = value;
        setMenu(updated);
    }; 
    
    const handleCreateMenu = async () => {
        setLoading(true);

        const payload = menu
          .filter(d => !d.blank && d.food)
          .map(d => ({
            id: d.id || 0,
            date: d.date ,  
            foodId: d.food.id,
        }));
      
        const changedPayload = payload.filter(item => {
            const ex = existingItems.find(e => e.date === item.date);
            if (!ex) return true;          
            return ex.foodObj.id !== item.foodId; 
        });
    
        const newItems    = changedPayload.filter(item => item.id === 0);
        const updateItems = changedPayload.filter(item => item.id !== 0);
      
        try {

          if (newItems.length > 0) {
            const addRes = await fetch(
              ' {Lunch_Service_Address}/api/KitchenMenu/AddRangeKitchenMenu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                  newItems.map(({ date, foodId }) => ({ date, foodId }))
                ),
              }
            );
            if (!addRes.ok) throw new Error('افزودن منو ناموفق بود');
            toast.success('آیتم‌های جدید با موفقیت اضافه شدند.');
          }

          if (updateItems.length > 0) {
            if (!hasRole('Manager')) {
              toast.error('فقط مدیر می‌تواند منو را ویرایش کند.');
            } else {
              const updRes = await fetch(
                ' {Lunch_Service_Address}/api/KitchenMenu/UpdateRangeKitchenMenu', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updateItems),
                }
              );
              const updData = await updRes.json();
              if (!updRes.ok || !updData.isSuccess) {
                throw new Error(updData.message || 'آپدیت منو ناموفق بود');
              }
              toast.success('آیتم‌های موجود با موفقیت ویرایش شدند.');
            }
          }
      
          await fetchMenuData();
        } catch (error) {
          console.error(error);
          toast.error(error.message || 'خطا در ارتباط با سرور');
        } finally {
          setLoading(false);
        }
    };      

    // const handleCreateMenu = async () => {
    //     setLoading(true);

    //     const payload = menu
    //         .filter(d => !d.blank && d.food)
    //         .map(d => ({
    //             id: d.id || 0,
    //             date: d.date,
    //             foodId: d.food.id
    //         }));
    
    //     const changedPayload = payload.filter(item => {
    //         const ex = existingItems.find(e => e.date === item.date);
    //         if (!ex) return true;
    //         return ex.foodObj.id !== item.foodId;
    //     });
    
    //     if (changedPayload.length === 0) {
    //         setLoading(false);
    //         toast.info('مورد جدید یا تغییری برای ثبت وجود ندارد.');
    //         return;
    //     }
    
    //     try {
    //         const response = await fetch(
    //             ' {Lunch_Service_Address}/api/KitchenMenu/UpdateRangeKitchenMenu', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json', accept: '*/*' },
    //             body: JSON.stringify(changedPayload),
    //         });
    //         const data = await response.json();
    //         if (data.isSuccess) {
    //             toast.success('منو با موفقیت ذخیره شد.');
    //             fetchMenuData();
    //         } else {
    //             toast.error(data.message);
    //         }
    //     } catch {
    //         alert('خطا در برقراری ارتباط با سرور');
    //     } finally {
    //         setLoading(false);
    //     }
    // };    

    const hasChanges = useMemo(
        () => menu.some(d => !d.blank && d.food && !existingItems.some(e => e.date === d.date && e.foodObj.id === d.food.id)),
        [menu, existingItems]
    );

    return (
        <Box p={4} flex={5}>
            <ToastContainer position="bottom-right" autoClose={5000} rtl pauseOnHover />
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Button variant="outlined" onClick={() => setCurrentMonthDate(prev => prev.clone().subtract(1, 'jMonth'))}>
                    ماه قبل
                </Button>
                <Typography sx={{ fontSize: { xs: '12px', sm: '16px' }, fontWeight: 'bold' }}>
                    {convertToPersian(currentMonthDate.format('jMMMM jYYYY'))}
                </Typography>
                <Button variant="outlined" onClick={() => setCurrentMonthDate(prev => prev.clone().add(1, 'jMonth'))}>
                    ماه بعد
                </Button>
            </Box>

            <Grid container spacing={2}>
                {menu.map((day, idx) => {
                    const dateObj = dayjs(day.date);
                    const dayOfWeek = dateObj.locale('fa').format('dddd');
                    const isFriday = dayOfWeek === 'جمعه';
                    if (isFriday) return null;

                    const isToday = dateObj.isSame(dayjs(), 'day');
                    const isBefore = dateObj.isBefore(dayjs(), 'day');
                    const isWeekend = isFriday;

                    const startOfWeek = dayjs().startOf('week');
                    const endOfWeek = startOfWeek.add(5, 'day');
                    const nextStart = startOfWeek.add(6, 'day');
                    const nextEnd = nextStart.add(5, 'day');
                    const isThis = dateObj.isSameOrAfter(startOfWeek, 'day') && dateObj.isSameOrBefore(endOfWeek, 'day');
                    const isNext = dateObj.isSameOrAfter(nextStart, 'day') && dateObj.isSameOrBefore(nextEnd, 'day');
                    const late = [3,4,5].includes(dayjs().day());
                    const restricted = late && isNext;
                    const disabled = isThis || isWeekend || restricted || isBefore;

                    const holidayName = isHoliday(day.date);
                    
                    if (day.blank) {
                        return (
                            <Grid item display={{ xs: 'none', sm: 'block' }} xs={6} sm={6} md={4} lg={2} key={idx}>
                                <Box sx={{ height: 160 }} />
                            </Grid>
                        );
                    }

                    return (
                        <Grid item xs={6} sm={6} md={4} lg={2} key={idx}>
                            <Card sx={{
                                boxShadow: 3,
                                borderRadius: '8px',
                                border: isToday ? '2px solid #1565c0'
                                    : day.food ? '2px solid #1f8423'
                                    : holidayName ? '2px solid red' : '2px solid transparent',
                                backgroundColor: isToday ? '#1976d224' : '',
                                opacity: (isBefore && !day.food) || holidayName ? 0.5 : 1,
                                pointerEvents: (isBefore && !day.food) || holidayName ? 'none' : 'auto',
                            }}>
                                <CardContent sx={{ padding: '12px' }}>
                                    <Typography variant="h6" textAlign="center" mb={0.5} sx={{ fontSize: '14px', fontWeight: 600, color: holidayName ? 'red' : '#006BD6' }}>
                                        {dayOfWeek}
                                    </Typography>
                                    <Typography variant="body2" textAlign="center" mb={1} sx={{ fontSize: '13px', color: '#666' }}>
                                        {convertToPersian(dateObj.locale('fa').format('D MMMM YYYY'))}
                                    </Typography>
                                    <FormControl fullWidth margin="normal">
                                        {disabled || holidayName ? (
                                            <TextField value={holidayName || day.food?.name || ''} size="small"
                                                sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, '& .MuiOutlinedInput-input': { textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: holidayName ? 'red' : '' }, '& .MuiOutlinedInput-root': { padding: 0 } }}
                                                InputProps={{ readOnly: true }} />
                                        ) : (
                                            // <Autocomplete 
                                            //     options={foodList} 
                                            //     value={day.food} 
                                            //     disableClearable 
                                            //     isOptionEqualToValue={(o,v)=>o.id===v?.id}
                                            //     getOptionLabel={o=>o.name}
                                            //     onChange={(e,v)=>handleChangeFood(idx, null, v)}
                                            //     renderInput={params=><TextField {...params} size="small" InputProps={{ ...params.InputProps, sx:{ fontSize:'12px' } }} />} 
                                            // />
                                            <Autocomplete
                                                options={foodList}
                                                value={day.food}
                                                disableClearable
                                                isOptionEqualToValue={(o, v) => o.id === v?.id}
                                                getOptionLabel={(o) => o.name}
                                                onChange={(e, v) => handleChangeFood(idx, null, v)}
                                                renderInput={(params) => (
                                                    <TextField
                                                    {...params}
                                                    size="small"
                                                    InputProps={{ ...params.InputProps, sx: { fontSize: '12px' } }}
                                                    />
                                                )}
                                            />
                                        )}
                                    </FormControl>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            <Box mt={4} textAlign="center">
                <Button variant="contained" color="success" size="large" disabled={!hasChanges || loading} onClick={handleCreateMenu}
                    sx={{ fontSize: '14px', padding: '10px 20px', borderRadius: '8px' }}>
                    {loading ? 'لطفا منتظر بمانید...' : 'ذخیره منو'}
                </Button>
            </Box>
        </Box>
    );
};

export default AddMenu;
