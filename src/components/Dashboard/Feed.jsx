import React from 'react';
import { Box, Grid } from "@mui/material";
import Post from "./Post";
import convertToPersian from '../../assets/Converter/ConvertToPersian';
import { useWallet } from "../../context/WalletContext";

const Feed = () => {

    const { walletBalance } = useWallet();

    const posts = [
        { 
            title: "بالانس کیف پول شما", 
            content: walletBalance !== null ? convertToPersian(walletBalance.toLocaleString() + ' ریال') : "در حال دریافت..." 
        },
        // { title: "اطلاعیه شماره ۱", content: "جلسه روز شنبه ساعت ۱۰ برگزار می‌شود." },
        // { title: "اطلاعیه شماره ۲", content: "سیستم به‌روزرسانی شد، لطفاً بررسی نمایید." },
        // { title: "یادآوری", content: "لطفاً فرم مرخصی را تا پایان هفته ارسال کنید." },
        // { title: "اطلاعیه جدید", content: "سالن غذاخوری از هفته آینده تعطیل است." },
    ];

    return (
        <Box p={4} flex={5}>
            <Grid container spacing={4}>
                {posts.map((post, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Post
                            title={post.title}
                            content={post.content}
                            date={post.date}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default Feed;
