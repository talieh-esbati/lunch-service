import React, { useState, useEffect  } from 'react';
import {
  Box, Typography, TextField, FormControlLabel, RadioGroup,
  Radio, FormControl, Select, MenuItem, Button,Modal,Stack,
  Divider, Table, TableHead, TableRow, TableCell, TableBody,
  Switch, IconButton, Avatar, Grid, TableContainer,Pagination
} from "@mui/material";
import noImage from '../../assets/images/noImage.png'
import { Edit, Delete } from '@mui/icons-material';
import PersianNumberSplitter from '../../assets/Converter/PersianNumSplitter';
import convertToPersian from '../../assets/Converter/ConvertToPersian';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const AddFood = () => {
    const [foodName, setFoodName] = useState('');
    const [price, setPrice] = useState('');
    const [available, setAvailable] = useState(true);
    const [image, setImage] = useState(null);
    const [blobImage, setBloBImage] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [foodList, setFoodList] = useState([]);
    const [editIndex, setEditIndex] = useState(null);
    const [typeOptions, setTypeOptions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [typeId, setTypeId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedFoodId, setSelectedFoodId] = useState(null);
    const [selectedFoodName, setSelectedFoodName] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const pageCount = Math.ceil(foodList.length / rowsPerPage);

    useEffect(() => {
        const fetchInitData = async () => {
            try {
                const response = await fetch(' {Lunch_Service_Address}/api/Configuration/Init');
                const data = await response.json();
                setTypeOptions(data.enums.FoodTypeEnum.values || []);
                setCategoryOptions(data.enums.CourseTypeEnum.values || []);
            } catch (error) {
                console.error('خطا در گرفتن اطلاعات اولیه:', error);
            }
        };
    
        fetchInitData();
    }, []);

    const fetchListData = async () => {
        try {
            const response = await fetch(' {Lunch_Service_Address}/api/Food/GetAllFoods', {
                method: 'GET',
                headers: {
                    'Accept': '*/*',
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            setFoodList(data.result);
            setPage(0);
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred');
        }
    };

    useEffect(() => {
        fetchListData(); 
    }, []);

    const uploadToCloudinary = async (file) => {
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", "food-image");
        data.append("cloud_name", "dyksec6av");
      
        try {
          const res = await fetch("https://api.cloudinary.com/v1_1/dyksec6av/image/upload", {
            method: "POST",
            body: data,
          });
      
          const json = await res.json();
          
          return json.secure_url;
        } catch (err) {
          console.error("Cloudinary Upload Error:", err);
          return null;
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        let imageUrl = previewUrl;
    
        if (blobImage) {
            imageUrl = await uploadToCloudinary(blobImage);
            if (!imageUrl) {
                toast.error("آپلود تصویر با خطا مواجه شد");
                setLoading(false); 
                return;
            }
        }
    
        const foodData = {
            id: editIndex !== null ? foodList[editIndex].id : 0,
            name: foodName,
            price: price,
            foodType: typeId,
            courseType: categoryId,
            foodImage: imageUrl,
            activeIND: available,
        };
    
        const url = editIndex !== null
            ? ' {Lunch_Service_Address}/api/Food/EditFood'
            : ' {Lunch_Service_Address}/api/Food/AddFood';
    
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': '*/*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(foodData),
            });
    
            if (response.ok) {
                fetchListData();
                toast.success(editIndex !== null ? 'غذا با موفقیت ویرایش شد' : 'غذا با موفقیت افزوده شد');
                clearForm(); 
            } else {
                toast.error('خطا در ثبت اطلاعات');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred');
        }
        finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            const response = await fetch(` {Lunch_Service_Address}/api/Food/DeleteFood?foodId=${selectedFoodId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.isSuccess) {
                toast.success('غذا با موفقیت حذف شد');
                setIsModalVisible(false);
            } else {
                toast.warn(data.message);
            }
            setSelectedFoodId(null);
            //setIsModalVisible(false);
            await fetchListData();
        } catch (error) {
            console.error(error);
            toast.error('حذف غذا با خطا مواجه شد.');
        } finally {
            setLoading(false);
        }
    };

    const isFormValid =
    foodName.trim() !== '' &&
    price !== '' &&
    typeof typeId === 'number' &&
    typeof categoryId === 'number';

    const handleEdit = (food) => {
        setFoodName(food.name);
        setPrice(food.price);
        setTypeId(food.typeId);
        setCategoryId(food.categoryId);
        setAvailable(food.activeIND);
        setImage(null);
        setPreviewUrl(food.foodImage);
        setEditIndex(food.id);
    };

    const handleOpenImage = () => {
        if (previewUrl) {
            window.open(previewUrl, '_blank');
        }
    };

    const clearForm = () => {
        setFoodName('');
        setPrice('');
        setTypeId('');
        setCategoryId('');
        setAvailable(true);
        setImage(null);
        setPreviewUrl(null);
        setEditIndex(null);
    };

    const handleOpenModal = (id,name) => {
        setSelectedFoodId(id);
        setSelectedFoodName(name);
        setIsModalVisible(true)
    };
    
    const handleCloseModal = () => {
        setIsModalVisible(false);
    };

    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 320,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 24,
        p: 3,
    };

    return (
        <Box p={4} flex={5}>
            <ToastContainer
                position="bottom-right"
                autoClose={5000}        
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={true}           
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            <Typography
                variant="h6"
                fontWeight="bold"
                sx={{
                    textAlign: { xs: 'center', sm: 'right' },
                    marginBottom: { xs: '10px', sm: 3 },
                    fontSize: { xs: '14px', sm: '16px' },
                }}
            >
                افزودن غذا
            </Typography>

            <Box display="flex" flexDirection="column" gap={2}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            label="نام غذا"
                            value={foodName}
                            onChange={(e) => setFoodName(e.target.value)}
                            size="small"
                            variant="outlined"
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            label="قیمت (ریال)"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            size="small"
                            variant="outlined"
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControl fullWidth>
                            <RadioGroup
                                value={typeId}
                                onChange={(e) => setTypeId(Number(e.target.value))}
                                row
                            >
                                {typeOptions.map((item) => (
                                    <FormControlLabel
                                        key={item.id}
                                        value={item.id}
                                        control={<Radio />}
                                        label={item.description}
                                    />
                                ))}
                            </RadioGroup>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <FormControl fullWidth size="small">
                            <Select
                                value={categoryId}
                                onChange={(e) => setCategoryId(Number(e.target.value))}
                                displayEmpty
                            >
                                <MenuItem value="" disabled>دسته‌بندی را انتخاب کنید</MenuItem>
                                {categoryOptions.map((item) => (
                                    <MenuItem key={item.id} value={item.id}>{item.description}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Box display="flex" flexDirection="column" gap={1}>
                            {!previewUrl ? (
                                <Button
                                    variant="outlined"
                                    component="label"
                                    sx={{ width: 'fit-content' }}
                                >
                                    انتخاب تصویر
                                    <input 
                                        type="file" 
                                        hidden 
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                              setBloBImage(file);
                                              setPreviewUrl(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                </Button>
                            ) : (
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        <Button
                                            onClick={handleOpenImage}
                                            sx={{ padding: 0, textDecoration: 'underline' }}
                                        >
                                            مشاهده تصویر
                                        </Button>
                                    </Typography>
                                    <IconButton
                                        onClick={() => {
                                            setPreviewUrl(null);
                                            setImage(null);
                                        }}
                                        color="error"
                                        size="small"
                                    >
                                        <Delete sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={available}
                                    onChange={() => setAvailable(!available)}
                                    size="small"
                                />
                            }
                            label={available ? "فعال" : "غیرفعال"}
                        />
                    </Grid>
                </Grid>
            </Box>

            <Box mt={2}>
                <Button
                    variant="contained"
                    color='primary'
                    onClick={handleSubmit}
                    disabled={!isFormValid || loading}
                    fullWidth
                >
                    {loading
                        ? 'لطفا منتظر بمانید...'
                        : editIndex !== null
                        ? 'ویرایش غذا'
                        : 'افزودن غذا'
                    }
                </Button>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography
                variant="h6"
                fontWeight="bold"
                sx={{
                    textAlign: { xs: 'center', sm: 'right' },
                    marginBottom: { xs: '10px', sm: 2 },
                    fontSize: { xs: '14px', sm: '16px' },
                }}
            >
                لیست غذاها
            </Typography>
            <TableContainer sx={{ width: {xs: '300px' , sm : '100%'} }}>
                <Table >
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: '50px', textAlign: 'center' }}>ردیف</TableCell>
                            <TableCell sx={{ width: '100px', textAlign: 'center' }}>عکس</TableCell>
                            <TableCell sx={{ width: '200px', textAlign: 'center' }}>نام</TableCell>
                            <TableCell sx={{ width: '150px', textAlign: 'center' }}>قیمت</TableCell>
                            <TableCell sx={{ width: '150px', textAlign: 'center' }}>نوع</TableCell>
                            <TableCell sx={{ width: '150px', textAlign: 'center' }}>دسته بندی</TableCell>
                            <TableCell sx={{ width: '150px', textAlign: 'center' }}>وضعیت</TableCell>
                            <TableCell sx={{ width: '150px', textAlign: 'center' }}>عملیات</TableCell>
                        </TableRow>
                    </TableHead>
                        <TableBody>
                        {foodList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((food, index) => (
                            <TableRow key={index}>
                                <TableCell sx={{ textAlign: 'center' }}>{convertToPersian(page * rowsPerPage + index + 1)}</TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>
                                    <Box display="flex" justifyContent="center">
                                        <Avatar
                                            src={food.foodImage || noImage} 
                                            alt={food.name}
                                            variant="rounded"
                                            sx={{ width: 56, height: 56 }}
                                        />
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>{food.name}</TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>{PersianNumberSplitter(food.price)}</TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>{food.foodTypeName}</TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>{food.courseTypeName}</TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>
                                    {food.activeIND ? (
                                        <Box>
                                            <CheckCircle sx={{ fontSize: 18, color: "green" }} />
                                        </Box>
                                    ) : (
                                        <Box>
                                            <Cancel sx={{ fontSize: 18, color: "red" }} />
                                        </Box>
                                    )}
                                </TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>
                                    <IconButton onClick={() => handleEdit(food)} color="primary" size="small">
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton onClick={() => handleOpenModal(food.id,food.name)} color="error" size="small">
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                    count={pageCount}
                    page={page+1}
                    onChange={(e, value) => setPage(value-1)}
                    shape="rounded"
                    color="primary"
                />
            </Box>
            <Modal
                open={isModalVisible}
                onClose={handleCloseModal}
            >
                <Box sx={modalStyle}>
                    <Typography variant="body" mb={2}> آیا از حذف {selectedFoodName} مطمئن هستید؟ </Typography>
                    <Stack direction="row" justifyContent="flex-end" spacing={1} mt={3}>
                        <Button onClick={handleCloseModal} disabled={loading}>لغو</Button>
                        <Button variant="contained" color="success" disabled={loading} onClick={handleDelete}>حذف</Button>
                    </Stack>
                </Box>
            </Modal>
        </Box>
    );
};

export default AddFood;
