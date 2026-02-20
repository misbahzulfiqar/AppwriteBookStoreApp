import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout as authLogout } from '../store/authSlices';

function LogoutBtn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logoutHandler = () => {
    dispatch(authLogout());
    navigate('/auth/login');
  };

  return (
    <button
      className="bg-[#a67c52] text-white rounded-sm cursor-pointer hover:bg-[#b28c65] transition-colors h-10 w-20 px-4"
      onClick={logoutHandler}
    >
      Logout
    </button>
  );
}

export default LogoutBtn;
