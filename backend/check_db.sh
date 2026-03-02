#!/bin/bash
sudo mariadb -e "SELECT id, username, active, role, password FROM pragathienterprises.users;"
