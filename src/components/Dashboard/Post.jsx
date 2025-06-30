// Post.jsx
import React from 'react';
import {
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Checkbox,
    IconButton,
    Typography
} from "@mui/material";
import { Favorite, FavoriteBorder } from "@mui/icons-material";
import dayjs from 'dayjs';
import jalaliPlugin from 'jalali-dayjs';
import convertToPersian from '../../assets/Converter/ConvertToPersian'

dayjs.extend(jalaliPlugin);

const Post = ({ title = 'اطلاعیه جدید', content = 'متنی وارد نشده', date }) => {
    const today = date ? dayjs(date).locale('fa') : dayjs().locale('fa');
    const formatted = today.format('dddd D MMMM YYYY');

    return (
        <Card
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                boxShadow: 4,
                borderRadius: 4,
                transition: '0.3s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                }
            }}
        >
            <CardHeader
                title={title}
                subheader={convertToPersian(formatted)}
                sx={{ fontSize: '14px', fontWeight: 600 }}
            />
            <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    {content}
                </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                <IconButton aria-label="add to favorites">
                    <Checkbox icon={<FavoriteBorder />} checkedIcon={<Favorite sx={{ color: "red" }} />} />
                </IconButton>
            </CardActions>
        </Card>
    );
};

export default Post;
