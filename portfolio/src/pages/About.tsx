import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo, PixelText2D, HarryRotation } from 'hds';
import { audioManager, type PlaybackHandle } from '../../../harryds/src/utils/audioManager';
import { useTheme } from '../theme/useTheme';
import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import hoverSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep.mp3';
import clickSoundUrl from '../../assets/sound/8-Bit Sound Effect Beep 3.mp3';
import award01 from '../../assets/imgs/awards/award-01.png';
import award02 from '../../assets/imgs/awards/award-02.png';
import award03 from '../../assets/imgs/awards/award-03.png';
import award04 from '../../assets/imgs/awards/award-04.png';
import logoAwwrated from '../../assets/imgs/logos/logo-awwrated-dark.png';
import logoKkday from '../../assets/imgs/logos/logo-kkday-dark.png';
import logoNownews from '../../assets/imgs/logos/logo-nownews-dark.png';
import logoWalkerland from '../../assets/imgs/logos/logo-walkerland-dark.png';
import logoIxda from '../../assets/imgs/logos/logo-ixda-dark.png';
import logoAapd from '../../assets/imgs/logos/logo-aapd-dark.png';
import logoQnap from '../../assets/imgs/logos/logo-qnap-dark.png';
import logoUxy from '../../assets/imgs/logos/logo-uxy-dark.png';
import logoShopmatic from '../../assets/imgs/logos/logo-shopmatic-dark.png';
import '../pages/Home.scss';
import Header from '../components/Header';

// Giphy URLs from Footer.tsx
const GIPHY_URLS = [
  'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjhoaWd3MjhlODV1MW04MndpYnc1cjJ3cHBnd2xvY2N3MndldjN3eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/omZy7Mbo8DxX7Utv5W/giphy.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZjZtZWhzaGFmOWN0MmUyeDVvaXAwaHU2czJkNzU1dDltaWhnZW5rYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/WtPVp414THEtT3bhyG/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbjFnOWNoeDdjZnowaGMxa2JuY2ozOWNiM2h5cXlzbHRxNjV4OGdiMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/X40zUKTGZgp7q/giphy.gif',
  'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcG5laWN1MG90bzFqOXBlNThla2R4czAwdmIxbTM2anRna2Jua2F0cyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/wAYwTly5Bmpj2/giphy.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHhqMTEzNWZydmF3ZWpsZHd5OG5ncm5yeTB5dGE0c2k3M243MXpsdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/zVDMwAMkpalos/giphy.gif',
  'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHZvdXY1bHY2YzVtaWJ5dHA0MzlsdzN5dGN1Zmp0YWtiMGJ6bzBxMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6m15BEfdhWiKQ/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXRza3Vxa3ZvZXNvcGVobzgybHplOHo5b2o4ZmNpZmZsemd3YmI4ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/YXTc5Rsv5ReqQ/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbjRkeWVrY2I0eGozbmdjM2JxemNlemQ4aTNnbHJwdmowYWRuc21mYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KdrWY4sOKhpyVvwvbz/giphy.gif',
  'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExajhxb2VxenM5NDdpdWNpcW8ycGdlY2Z3YWdmcWliaGh4bXFnbGViaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l46CqLVMWzaJUFPLW/giphy.gif',
  'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExb20zcnlveDV3anB6N3U5Nmpjb2syYTg1ejZscGJyd25kdGEwMWNrbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xUNd9EWKxIKSMYvH0c/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmJoejRzeG9xNWs4dXl0MjYxaGlyMW9tYzBzZTY3ZTd1YWdnbmhnaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XwfrJN8Xe1W0w/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2ljZ3V0eHZtdHd0Y2dvZTh6MzFxOWp5OWhsMWs1d3lqdXprZmVoOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/12QMzVeF4QsqTC/giphy.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXR1MTU1N2hneXFyb21tam5uMGhvOXUwMm04eHp0ODd1dmg1d3cwciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/f9p9GclvDGqcM/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExb212dnl4N2w3M3J4amdxZDd0aDV0eTJsMTF5ZTBwcnByYm12MWhneiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/dgEIhYAo3lZiE/giphy.gif',
  'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExMnRvdHc5ZzNtOWZyY3o5ZzQweXNhNTdwNDNzenJjb2Y2M2Rwc2FuaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/J1WfRHBFj8lFK/giphy.gif',
  'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZnc3Yzd2bWJxMXNxaWM3em1jbzh5M3JhYmNpcmJwanN6N3VtY3hhdSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/EPPvrXLVm6Axy/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExOXR1bm9lNDB4OGg3NTV6ZmcybGZsemVlbGU5Y3Fla3Y2ZnAzcm0zZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3ofSB7U5WWY6yJIN6o/giphy.gif',
  'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTFuY2NhM3FyMW0wY3N1bm81YW1yb3h2NWxiNjh5OGUydDBha3B4YiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/iFDuquCYcUY7cEyey7/giphy.gif',
  'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGc2dG9yeHVtZGZoYXQ2ZGRvaWFrNzN3cm5wZXZsNmQ4M291bGJnMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/4e0ETyN0pyz72/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNDc4b3M4ZTBqbjRsNHZkMGM1dzdkdzhlaGFpM281b3ZtcXBybWkybCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/sJs1Ag97x0MV2/giphy.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWxjcG5wOG12OWRmM3k3YjlnbzdwajB4eHp3eDA2NHBvdDRvaDdyZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hXOnZBQOmQKpW/giphy.gif',
  'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnM5MXh6MXJhd3FhNTQ2dDJ0OHZ1ODZnNWk0dzg3ZjF3a205dmgybCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/qK2WSgYX1B5CM/giphy.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDhlcjloZG9yemg0bTlkMGlrNTQ0djNlYnhoNnE2dDRhMGUxZHo0dSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/PNDOALYdDQ7xS/giphy.gif',
  'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmczMGJycjducnFxdmZwOXU0b3diOWYxMDZsdTMzbjBucjl2dmhsNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/d9QiBcfzg64Io/giphy.gif',
  'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTN5cTl0MzM0OGsxOXlvZ2ppd2w4d240ZGIwbnNnenkyYXN3Mzd3byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2IKCcxHhdOnSM/giphy.gif',
  'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcTV2OHQ3c3QxaTc0Z3FicGY5ZmVka3lkbmd5NXU5Mm84b3oyaXk2aiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/dbb8SIhBhflLi/giphy.gif',
  'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExZWc5ZHE4ZWVnNHZ0aXU0ZTQxaWp3c3kxanhmdGUxMno5cjZ3NDQzZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/11jGtzDu7Nh89a/giphy.gif',
  'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmhkam0yczlvc3F5bjZwa3BtNHl6YXIwYXJ2MTk0a3VyNnBvM2s1ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/tlLBddTfaJmJG/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHN0Z2hlbHpzaGRlNXZtdTI2ZmdjbjMwamFjbjh0cHZ2Z2E5YWF5bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/dbd6jN0Atb9i8/giphy.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2E1dmtyMXMycWJ3MG82ZXJ6ZXg2c3plZWVsejQ1dzl6M3c3bXZudyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o6MbgE0r1RccqxGfu/giphy.gif',
  'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWNvZGR5M3I0bXhuc2gyZzhxNmFwdnBzOG1tODB4ZXVma3B2dHc1YSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Zgvj4OxTtCSxG/giphy.gif',
  'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNDk2NGU0cXV4Z3NudGxiMGd1bXh2bm00ZmNqcGNpaTg1bzAyeTRqaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/IPR9FyG0dVol2/giphy.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExanR6bTQwazB2amk2cDQ0YTBlaWV5ZW9qaDZrcTc3NW1qYmJ5N2JhaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/azGJUrx592uc0/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWNvcmhsY295ODBuY3hpdXp1Z3hyMzhkczl3cHhteHExZHNnaGE4MyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l2JI7TmcJTrsp59fi/giphy.gif',
  'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTd6Y2J0ZDVpZDcydHk0anNmYTJxenM1ZXNjcHlmeTQ3bTF0MDlmMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JBJ0wVpiY22Ag/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWFyZ2o4YjhxaHcxcGZiNmdmNmlndnJoNDNjYjI1bWFxNWFpemprcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/WUDGo9jYZzVt3DExhi/giphy.gif',
  'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWh4M2tsYjA4cWE4amVydXoyODVsNXI3ZWthNzBsZXo1amxqMjYwZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/gCzPZyR0ayIak/giphy.gif',
  'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2I5a3h5bHhhYWF3OHV2OGdta2NlN2dicm5xZmUwNnBxcml0bHNyNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0rltXQqwXdi8/giphy.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExOGc2eXJpaWhmNGV3Zno2bHVqbG4yMXJ3a2dmcXA3ZnQybXlkN3Q2byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/kYDFO3rkOHrkQ/giphy.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExY25rdm4weXl0bGx3Y3ZocGo0ZXlpODdqcDJmZGNuZm50eTd3OW94MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1b0K93CJhfa3C/giphy.gif',
  'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXhoa3Zxems1ZWw0cHhyeXIxN3NtdDQwamNkbWxjaHA0c3d4NGk0byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/qAkRAS7IVW5Wn7GDGr/giphy.gif',
  'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExYzNtaTZuNG1hZm5jNXN6MG11NnVrM3E4azJ6ODN5c204NW9ya2JzNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/WtgwBP21Gujtu/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDFjOXAybHczaTdxbzh2bmcyZWhyYmM1ZG1leDhsNGdtZ2lwd25xMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/U7JFAxoBKheil8Zlsn/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZDBoeXU1cWRsanY3NmRrNjhlZHAzejdnZXg3emE5ZWpwNzZoeTYzYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlD6X5Pi5EKDmbm/giphy.gif',
  'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbzVibW55M3A5dGl4bXgxMnppdmR2dDViMXF3eXJxbXJndXV6aTg5OSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l2QDLVFnYtDh9Deq4/giphy.gif',
  'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcTg4bHgwMW9vbTdjZ3dlamV4YW80OXowamN2YWNvajRsaGs5b3V6cCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/gcvi3QjsHNppC/giphy.gif',
  'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNW10dzkyMHozeDczdWZyYnEzdXpyMTd0MmI5emRsNzZwcjZidzVqcCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1zKfKJWwaS0OMvOO5q/giphy.gif',
  'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTU2Z3BrZDNkNjR1dzJwcmtnY2FkNGZwMXR1eGJieHYxNTBiNzhqaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/K4ppHUZTYKJYk/giphy.gif',
  'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3JkaG1icGgzbjJzbTM3MXdpOWZwcWE3amdxam5idzB3eWRia2UwdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/4LTGEdPueINFzycY1Ixq/giphy.gif',
  'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExaXlka3czMmdxbmhtazBrOWxja3FxMTEycDc3aWxzampzaG82YmV3cCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/RxR1KghIie2iI/giphy.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExeGZ1MzU0N2tzaGc5cjI3bTVjc28xbTV1ajZkc2NhczAybmE0dHoxZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/aJsPXVTcppvoI/giphy.gif',
  'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExZmYxOWI4ZWRrMjlrNmEwd3UwZjE3cHBmamQxb2t1M3I2NjNld20ydiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3rgXBrg00rx6gmU7lK/giphy.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExc25yaHpiYmdmb3k1ZXh1NzUybzJyMHB0azFwdjFjYnIyeXdrajhyZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/76BDMXBI5zgu4/giphy.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExaXc5bzBpMmlxNXBmMzB5d2lnOTE2dHpsZWo0em1pdXRtM3ZtcjRxciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KDEIKGUrdMYbrNF62H/giphy.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXhuZXBqdXFjNDljbnpod3poa3JpbDh1cDRxYWw2azk0MzVvOHd6MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1405fIarqbN7hu/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTZzZGwxcWJzYzJqOXpqMTJybWxyeXdxbzZ0ZnI5Njh6Y2hoMzg4biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QDNaJaLktyCCQ/giphy.gif',
  'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2l5ZDcwYXlpdzNubmFwcjhocjRpcW0zaWJjc3k4aTM4Z3Bna3c1diZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZY8N10YDy1HcHJSFtY/giphy.gif',
  'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExc3NpNTJzMGoyZmgyNGs1dWd5Mzc5bTBoY3JzOG03b2cweHg0bWNrciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/WY98eEjo1LtC/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNTl5cW5xa2NidmpseXI5YzFmMTZkaWM5M2FubXBpZ2RpanQzZGI0bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bnaU5MgaRcQiA/giphy.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHAwN2pvNTVicGh6em1hdjY5c3ZsdnViNmwwNGg5YWZ4MGlvaXNxMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L8Xuy2cLkQ4ZvWM5rU/giphy.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExOG95ejZiYXNrcTB0bmRmZWw5N3JvMTZ6MjFvNnR0bGMxd2VldG42dCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2kAAWsiWjiunm/giphy.gif',
  'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExOWU2cGJxcjF4bzg5Z2U4dWJ3aG95Zm5zYXg0eWx3ZjV2d2V3eHppZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/16KdaesKdaAI8/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3RpMWNnOGFxaXh5aDE3bXFrYjh4Y3o3dDFwejFuOWl3c3Qzcnp3bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Ih6GMHNeQtKYyiqCmf/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ29jbmo5OWlmNzFtMDA5NG1iMHc2amkzeXA1dTdobjZodWx6NXc3byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/d2YWTOsVtuHgOHhC/giphy.gif',
  'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExaXhvY24ycjRkazlkd2hub2gwZ3hiYm1wdmN1MWZjNHp3ODUydXdveCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o6wraGHbaesVVebjW/giphy.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnIyc3c3OGF6ZTRkZHVpaGdsNW5rZnFncDBtNjJ2ZW9hazBkOWNkdSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/4XZa6bYZLHLMI/giphy.gif',
];

const About: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const menuHoverHandleRef = useRef<PlaybackHandle | null>(null);
  const menuClickHandleRef = useRef<PlaybackHandle | null>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const heroDescriptionRef = useRef<HTMLParagraphElement>(null);
  const introSectionRef = useRef<HTMLElement>(null);
  const introPrimaryColumnRef = useRef<HTMLDivElement>(null);
  const introVisualRef = useRef<HTMLDivElement>(null);
  const awardsSectionRef = useRef<HTMLElement>(null);
  const clientsSectionRef = useRef<HTMLElement>(null);
  const backgroundSectionRef = useRef<HTMLElement>(null);

  // HarryRotation frame state
  const [rotationFrame, setRotationFrame] = useState(1);

  // Giphy marquee state
  interface GiphyItem {
    id: string;
    url: string;
  }
  const [giphyItems, setGiphyItems] = useState<GiphyItem[]>([]);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const itemPositionsRef = useRef<Map<string, number>>(new Map());

  // 初始化 giphy 項目
  useEffect(() => {
    const getRandomGiphyUrl = () => {
      const index = Math.floor(Math.random() * GIPHY_URLS.length);
      return GIPHY_URLS[index];
    };

    // 計算初始需要的圖片數量（基於視窗寬度）
    const itemWidth = 300; // 圖片寬度
    const gap = 100; // 間距
    const totalItemWidth = itemWidth + gap;
    const initialCount = Math.ceil(window.innerWidth / totalItemWidth) + 2; // 多加2個確保無縫

    const initialItems: GiphyItem[] = [];
    for (let i = 0; i < initialCount; i++) {
      initialItems.push({
        id: `giphy-${Date.now()}-${i}`,
        url: getRandomGiphyUrl(),
      });
    }

    setGiphyItems(initialItems);

    // 初始化位置
    const positions = new Map<string, number>();
    initialItems.forEach((item, index) => {
      positions.set(item.id, index * totalItemWidth);
    });
    itemPositionsRef.current = positions;
  }, []);

  // 跑馬燈動畫
  useEffect(() => {
    if (giphyItems.length === 0) return;

    const itemWidth = 300;
    const gap = 100;
    const totalItemWidth = itemWidth + gap;
    const speed = 1; // 每幀移動的像素數

    const animate = () => {
      const positions = itemPositionsRef.current;
      let needsUpdate = false;
      const itemsToRemove: string[] = [];
      const newItems: GiphyItem[] = [];

      // 更新每個項目的位置
      giphyItems.forEach((item) => {
        const currentPos = positions.get(item.id) ?? 0;
        const newPos = currentPos - speed;

        // 如果項目完全移出左側，標記為移除
        if (newPos < -(itemWidth + gap)) {
          itemsToRemove.push(item.id);
          needsUpdate = true;
        } else {
          positions.set(item.id, newPos);
        }
      });

      // 移除離開畫面的項目並添加新項目
      if (itemsToRemove.length > 0) {
        const getRandomGiphyUrl = () => {
          const index = Math.floor(Math.random() * GIPHY_URLS.length);
          return GIPHY_URLS[index];
        };

        // 找到最右邊的項目位置
        let maxPos = -Infinity;
        positions.forEach((pos) => {
          if (pos > maxPos) maxPos = pos;
        });

        // 為每個移除的項目添加一個新項目
        itemsToRemove.forEach(() => {
          const newItem: GiphyItem = {
            id: `giphy-${Date.now()}-${Math.random()}`,
            url: getRandomGiphyUrl(),
          };
          newItems.push(newItem);
          positions.set(newItem.id, maxPos + totalItemWidth);
          maxPos += totalItemWidth;
        });

        // 移除舊項目的位置記錄
        itemsToRemove.forEach((id) => {
          positions.delete(id);
        });
      }

      // 更新 DOM
      if (marqueeRef.current) {
        marqueeRef.current.childNodes.forEach((node, index) => {
          const item = giphyItems[index];
          if (item && node instanceof HTMLElement) {
            const pos = positions.get(item.id) ?? 0;
            node.style.transform = `translateX(${pos}px)`;
          }
        });
      }

      // 更新狀態
      if (needsUpdate) {
        setGiphyItems((prev) => {
          const filtered = prev.filter((item) => !itemsToRemove.includes(item.id));
          return [...filtered, ...newItems];
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [giphyItems]);

  // 導覽選單 hover 觸發一次動畫狀態
  const [menuAnimStates, setMenuAnimStates] = useState<Record<string, boolean>>({});
  const menuHoverTimersRef = useRef<Record<string, number>>({});

  const triggerMenuHoverOnce = useCallback((key: string) => {
    if (menuAnimStates[key]) return;
    setMenuAnimStates((prev) => ({ ...prev, [key]: true }));
    const DURATION = 1200;
    if (menuHoverTimersRef.current[key]) {
      clearTimeout(menuHoverTimersRef.current[key]);
    }
    menuHoverTimersRef.current[key] = window.setTimeout(() => {
      setMenuAnimStates((prev) => ({ ...prev, [key]: false }));
      delete menuHoverTimersRef.current[key];
    }, DURATION);
  }, [menuAnimStates]);

  useEffect(() => {
    return () => {
      Object.values(menuHoverTimersRef.current).forEach((id) => clearTimeout(id));
      menuHoverTimersRef.current = {};
    };
  }, []);

  const playMenuHoverSound = useCallback(async () => {
    try {
      menuHoverHandleRef.current?.stop();
      menuHoverHandleRef.current = await audioManager.play(hoverSoundUrl, { volume: 0.4 });
    } catch (err) {
      console.warn('Menu hover sound play failed:', err);
    }
  }, []);

  const playMenuClickSound = useCallback(async () => {
    try {
      menuClickHandleRef.current?.stop();
      menuClickHandleRef.current = await audioManager.play(clickSoundUrl, { volume: 0.3 });
    } catch (err) {
      console.warn('Menu click sound play failed:', err);
    }
  }, []);

  // 預載音效
  useEffect(() => {
    audioManager.preload(hoverSoundUrl).catch(() => {});
    audioManager.preload(clickSoundUrl).catch(() => {});
  }, []);

  // Hero 進場動畫：Title 打字效果 + 0.3s 後內文行動效
  useLayoutEffect(() => {
    if (!heroSectionRef.current || !heroTitleRef.current) return;
    gsap.registerPlugin(TextPlugin);

    const ctx = gsap.context(() => {
      const titleEl = heroTitleRef.current!;
      const fullText = (titleEl.textContent || '').trim();

      // 打字機：先清空文字，再以 TextPlugin 輸入
      gsap.set(titleEl, { text: '' });
      const tl = gsap.timeline();
      tl.to(titleEl, {
        duration: Math.max(0.8, fullText.length * 0.06),
        text: fullText,
        ease: 'none'
      });

      // 行動效：準備並進場（延遲 0.3s）
      const lineChildren = heroSectionRef.current!.querySelectorAll<HTMLElement>('.lineChild');
      if (lineChildren.length) {
        gsap.set(lineChildren, { yPercent: 100 });
        tl.to(
          lineChildren,
          {
            yPercent: 0,
            duration: 0.75,
            stagger: 0.15,
            ease: 'power3.out'
          },
          '+=0.3'
        );
      }
    }, heroSectionRef);

    return () => ctx.revert();
  }, [i18n.language]);

  // STEP 1 & 2: 視差效果與 pin 動畫
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    
    gsap.registerPlugin(ScrollTrigger);

    // 初始化視覺元素位置
    if (!introSectionRef.current || !introVisualRef.current) return;
    
    // 設置初始 top 位置
    const initialTop = introSectionRef.current.offsetTop;
    gsap.set(introVisualRef.current, { top: initialTop });

    // STEP 1: home__intro-visual 和 home__intro 一起以 1 倍速移動
    const visualElement = introVisualRef.current;
    
    // 1 倍速不需要視差動畫，元素會自然跟著頁面滾動

    // STEP 2: 當到達 10% 時 pin 住，直到 awards 頂部到達 50% 時取消 pin
    if (awardsSectionRef.current) {
      ScrollTrigger.create({
        trigger: visualElement,
        start: 'top 10%',
        endTrigger: awardsSectionRef.current,
        end: 'top 50%',
        pin: true,
        pinSpacing: false,
        markers: true // 開發時顯示標記，完成後可移除
      });
    }

    // STEP 3: 當 home__intro 底部離開後，移到左邊 -50vw，同時向上移動 100px
    // 同時將寬度從 2000px 改為 1950px，rotationFrame 從 1 變化到 8
    const rotationElement = visualElement.querySelector('.home__intro-rotation') as HTMLElement;
    
    gsap.to(visualElement, {
      x: '-52vw',
      y: '-=0',  // 向上移動 200px
      scrollTrigger: {
        trigger: introSectionRef.current,
        start: 'bottom 10%',
        end: '+=500',  // 從 start 位置再滾動 10%
        scrub: true,
        markers: true, // 開發時顯示標記，完成後可移除
        onUpdate: (self) => {
          // 根據進度計算當前幀數 (1 到 8)
          const progress = self.progress;
          const currentFrame = Math.round(1 + progress * 6); // 1 + (0~1) * 7 = 1~8
          setRotationFrame(currentFrame);
        }
      }
    });
    
    // 同時改變 HarryRotation 的寬度
    if (rotationElement) {
      gsap.to(rotationElement, {
        width: '2000px',
        scrollTrigger: {
          trigger: introSectionRef.current,
          start: 'bottom 10%',
          end: '+=10%',
          scrub: true,
          markers: true
        }
      });
    }

    // STEP 4: 當 awards 頂部到達 50% 時，取消 pin，以 1.2 速度向上移動
    // 使用 timeline 來確保 y 軸動畫的連續性
    if (awardsSectionRef.current && clientsSectionRef.current) {
      // 計算視窗高度的 50% 位置到 clients 底部的滾動距離
      const awardsToClientsHeight = clientsSectionRef.current.offsetTop + 
                                    clientsSectionRef.current.offsetHeight - 
                                    awardsSectionRef.current.offsetTop;
      
      // 以 1.7 速度移動，表示視差距離 = 滾動距離 * -0.7
      const step4ParallaxDistance = awardsToClientsHeight * -0.7;
      
      // 創建一個從當前位置繼續的動畫
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: awardsSectionRef.current,
          start: 'top 50%',
          endTrigger: clientsSectionRef.current,
          end: 'bottom bottom',
          scrub: true,
          markers: true // 開發時顯示標記，完成後可移除
        }
      });
      
      // 從當前 y 值繼續向上移動（負值表示加快向上速度）
      tl.to(visualElement, {
        y: `+=${step4ParallaxDistance}`,
        ease: 'none'
      });
    }

    // 監聽視窗大小變化並刷新
    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      ScrollTrigger.getAll().forEach(st => st.kill());
      setRotationFrame(1); // 重置為初始幀
    };
  }, [i18n.language]);


  // 語言切換相關
  const languageMap = {
    'zh-Hant': 'ZH',
    'zh': 'ZH',
    'en': 'EN',
    'ja': 'JP'
  };

  const currentLangDisplay = languageMap[i18n.language as keyof typeof languageMap] || 'EN';

  const handleLanguageChange = useCallback((lang: string) => {
    i18n.changeLanguage(lang);
    setIsLangDropdownOpen(false);
    playMenuClickSound();
  }, [i18n, playMenuClickSound]);

  const toggleLangDropdown = useCallback(() => {
    setIsLangDropdownOpen(prev => !prev);
    playMenuClickSound();
  }, [playMenuClickSound]);

  // 點擊外部關閉 dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };

    if (isLangDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLangDropdownOpen]);

  return (
    <div className="home">
      <Header
        onLogoClick={() => navigate('/')}
        logoType="default"
        logoAnimated={true}
        hideNav={false}
        menuItems={['home', 'works', 'article', 'about']}
        t={t}
        getMenuItemAnimated={(key) => !!menuAnimStates[key]}
        onMenuItemHover={(key) => { triggerMenuHoverOnce(key); playMenuHoverSound(); }}
        onMenuItemClick={(key) => { 
          playMenuClickSound();
          if (key === 'home') {
            navigate('/');
          } else if (key === 'about') {
            navigate('/about');
          }
        }}
        showThemeToggle={true}
        theme={theme}
        onToggleTheme={() => { playMenuClickSound(); toggleTheme(); }}
        onThemeHover={() => { playMenuHoverSound(); }}
        showLanguageToggle={true}
        currentLangDisplay={currentLangDisplay}
        isLangDropdownOpen={isLangDropdownOpen}
        onToggleLangDropdown={toggleLangDropdown}
        langDropdownRef={langDropdownRef}
        languageOptions={[
          { code: 'en', label: 'EN' },
          { code: 'zh-Hant', label: 'ZH' },
          { code: 'ja', label: 'JP' }
        ].filter((lang) => {
          const currentLang = i18n.language === 'zh' ? 'zh-Hant' : i18n.language;
          return lang.code !== currentLang;
        })}
        onLanguageChange={handleLanguageChange}
        onLanguageHover={() => { playMenuHoverSound(); }}
      />
      
      <main className="home__main">
        <section className="home__hero" aria-labelledby="about-hero-title" ref={heroSectionRef}>
          <h1 id="about-hero-title" className="home__hero-title" ref={heroTitleRef}>
            HI..I’M HARRY!
          </h1>
          <p className="home__hero-subtitle" ref={heroSubtitleRef}>
            <span className="lineParent">
              <span className="lineChild">PRODUCT DESIGN</span>
            </span>
          </p>
          <p className="home__hero-description" ref={heroDescriptionRef}>
            <span className="lineParent">
              <span className="lineChild">
                <span className="home__hero-description-intro">
                  ISN’T ABOUT CRAFTING DAZZLING VISUALS OR BUILDING CUTTING-EDGE TECH.
                </span>
              </span>
            </span>
            <span className="lineParent">
              <span className="lineChild">
                IT’S ABOUT APPLYING INSIGHT AND ANALYSIS TO REACH THE RIGHT USERS
              </span>
            </span>
            <span className="lineParent">
              <span className="lineChild">AND TRULY SOLVE THEIR PROBLEMS.</span>
            </span>
          </p>
        </section>

        <div className="home__intro-visual" aria-hidden="true" ref={introVisualRef}>
          <HarryRotation
            width={'2000px'}
            autoPlay={false}
            className="home__intro-rotation"
            frame={rotationFrame}
          />
        </div>

        <section className="home__intro" aria-labelledby="about-intro-title" ref={introSectionRef}>
          <div className="home__intro-grid">
            <div
              className="home__intro-column home__intro-column--primary"
              ref={introPrimaryColumnRef}
            >
              <h2 id="about-intro-title" className="home__intro-title feed-detail-overlay__section-title">
                Who AM I?<span className="feed-detail-overlay__cursor">_</span>
              </h2>
              <div className="home__intro-body">
                <p>
                  I’m Harry, with nearly 15 years’ experience in Product Design and Front-end Development.
                </p>
                <p>
                  I work as a Product designer and Front-end engineer, and I’m also a Design Systems course instructor at AAPD — using Design System to build processes and component libraries that help design and engineering collaborate efficiently, shorten time-to-market, and accelerate validation.
                </p>
                <p>
                  I also founded and have operated awwrated, a streaming information platform, for 6 years — growing the user base by 300% and page views by 800%.
                </p>
              </div>
            </div>
            <div className="home__intro-column home__intro-column--secondary" aria-hidden="true" />
          </div>
        </section>

        <section className="home__awards" aria-labelledby="about-awards-title" ref={awardsSectionRef}>
          <div className="home__intro-grid">
            <div className="home__intro-column home__intro-column--secondary" aria-hidden="true" />
            <div className="home__intro-column home__intro-column--primary">
              <h2 id="about-awards-title" className="home__intro-title feed-detail-overlay__section-title">
                Awards<span className="feed-detail-overlay__cursor">_</span>
              </h2>
              <div className="home__intro-body">
                <p>
                  I have participated in multiple Website and Product designs and have received the following international awards for recognition.
                </p>
              </div>
              <ul className="home__intro-awards">
                <li>
                  <img src={award01} alt="Awwwards Logo" className="home__intro-award-image home__intro-award-image--01" />
                  <span className="home__intro-awards-label">Awwwards</span>
                  <span className="home__intro-awards-detail">Honorable Mention, Jul 14, 2017</span>
                </li>
                <li>
                  <img src={award02} alt="App Store Badge" className="home__intro-award-image home__intro-award-image--02" />
                  <span className="home__intro-awards-label">APP STORE</span>
                  <span className="home__intro-awards-detail">Editor’s Choice, 2017</span>
                </li>
                <li>
                  <img src={award03} alt="CSS Design Awards Logo" className="home__intro-award-image home__intro-award-image--03" />
                  <span className="home__intro-awards-label">CSS DesignAwards</span>
                  <span className="home__intro-awards-detail">Website of the Day, Jan 17, 2013</span>
                </li>
                <li>
                  <img src={award04} alt="iHackGroup Award Logo" className="home__intro-award-image home__intro-award-image--04" />
                  <span className="home__intro-awards-label">iHackGroup</span>
                  <span className="home__intro-awards-detail">Best User Experience Award, 2016</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="home__clients" aria-labelledby="about-clients-title" ref={clientsSectionRef}>
          <div className="home__intro-grid">
            <div className="home__intro-column home__intro-column--secondary" aria-hidden="true" />
            <div className="home__intro-column home__intro-column--primary">
              <h2 id="about-clients-title" className="home__intro-title feed-detail-overlay__section-title">
                Clients &amp; Partners<span className="feed-detail-overlay__cursor">_</span>
              </h2>
              <div className="home__intro-body">
                <p>
                  Serving startups and enterprises alike:<br />
                  Product Design / Web Design /<br />
                  Design System Training &amp; Consulting.
                </p>
                <p>
                  A Systems-driven approach that helps teams ship faster and improve consistency.
                </p>
              </div>
              <div className="home__clients-logos">
                <img src={logoAwwrated} alt="awwrated logo" className="home__clients-logo home__clients-logo--awwrated" />
                <img src={logoKkday} alt="kkday logo" className="home__clients-logo home__clients-logo--kkday" />
                <img src={logoNownews} alt="NOWnews logo" className="home__clients-logo home__clients-logo--nownews" />
                <img src={logoWalkerland} alt="Walkerland logo" className="home__clients-logo home__clients-logo--walkerland" />
                <img src={logoIxda} alt="IXDA logo" className="home__clients-logo home__clients-logo--ixda" />
                <img src={logoAapd} alt="AAPD logo" className="home__clients-logo home__clients-logo--aapd" />
                <img src={logoQnap} alt="QNAP logo" className="home__clients-logo home__clients-logo--qnap" />
                <img src={logoUxy} alt="UXY logo" className="home__clients-logo home__clients-logo--uxy" />
                <img src={logoShopmatic} alt="Shopmatic logo" className="home__clients-logo home__clients-logo--shopmatic" />
              </div>
            </div>
          </div>
        </section>

        <section className="home__background" aria-labelledby="about-background-title" ref={backgroundSectionRef}>
          <div className="home__background-inner">
            <h2 id="about-background-title" className="home__background-title feed-detail-overlay__section-title">
              My design background<span className="feed-detail-overlay__cursor">_</span>
            </h2>
            <p className="home__background-description">
              My design inspiration didn't come from textbooks,<br />
              but from the startup sound of the Famicom (NES).<br />
              Japanese culture of the 1980s, 8-bit pixels, tokusatsu, and anime taught me to tell stories with images. I once aimed to become a manga artist or game illustrator~<br />
              Now I turn that obsession into a design methodology,<br />
              building products that are more loved and more usable.
            </p>
            <div className="home__background-rotation-wrapper">
              <div className="home__background-marquee" ref={marqueeRef} aria-hidden="true">
                {giphyItems.map((item) => (
                  <div
                    key={item.id}
                    className="home__background-marquee-item"
                    style={{
                      backgroundImage: `url(${item.url})`,
                    }}
                  />
                ))}
              </div>
              <div className="home__background-rotation">
                <HarryRotation
                  width={'250px'}
                  autoPlay={true}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;


