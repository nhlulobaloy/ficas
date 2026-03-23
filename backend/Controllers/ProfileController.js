import pool from '../config/db.js';

export const changePassword = () => {};

export const getProfile = async (req, res) => {
try {
  //no need to get the user from the db again since we have the data here;
  const user = req.user;
  res.status (200).json ({
    message: 'success',
    data: user,
  });
} catch (error) {
    console.log(error)
    res.status(500).json({message: "An error occured", error: error});
}
};
