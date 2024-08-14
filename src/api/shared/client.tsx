import axios from 'axios';

export const axiosClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    accept: 'application/json',
    zas: 'aK0eXSFmvO8GRnG_RSKFNi3HqY6bFZfNHKesulQTHh7JKlpgBsuXBeguwOzS12UOJBryRm3URIbCZsePF7sh_Ur_OMlqf3ANMxsVuKYAlOF1S0Bs4APwQ5qbaxe1l4oR17bjlR-_hiRVufTzzMmqqUrDokD1dKgaoOowQxpHKRWHxZxrKzWOf37susrGv20cYxYRKRomuPPb57_tL8Ivvg',
  },
});
