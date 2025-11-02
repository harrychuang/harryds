import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import './Footer.scss';
import { useParams, useLocation } from 'react-router-dom';
import { useStrapiFeed } from '../hooks/useStrapiFeed';
import type { FeedItem } from 'hds/types/feed';
import { useHover } from '../contexts/HoverContext';
import { useOverlay } from '../contexts/OverlayContext';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { useTheme } from '../theme/useTheme';
import ScrollIndicator from './ScrollIndicator';

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

const THANK_YOU_MESSAGES = [
  'Thanks!',
  'Thank you!',
  'Big thanks!',
  'Mega thx!',
  'You rock!',
  'Much love!',
  'So grateful',
  'Love it!',
  'Cheers!',
  'High five!',
];

const GIF_DISPLAY_DURATION_MS = 5000;
const EXIT_ANIMATION_DURATION_MS = 600;
const HEART_STORAGE_KEY = 'noeinoi-heart-liked';

const normalizePathKey = (raw: string | null | undefined): string => {
  if (!raw) {
    return '/';
  }

  const [pathPart] = raw.split('?');
  let normalized = pathPart || '/';

  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized || '/';
};

const getStoredLikedPaths = (): Set<string> => {
  if (typeof window === 'undefined') {
    return new Set();
  }

  const raw = window.localStorage.getItem(HEART_STORAGE_KEY);
  if (!raw) {
    return new Set();
  }

  if (raw === 'true') {
    return new Set(['/']);
  }

  if (raw === 'false') {
    return new Set();
  }

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return new Set(parsed.map((item) => normalizePathKey(String(item))));
    }

    if (parsed && typeof parsed === 'object') {
      const liked = new Set<string>();
      Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
        if (value === true || value === 'true') {
          liked.add(normalizePathKey(key));
        }
      });
      return liked;
    }
  } catch (error) {
    console.warn('[Footer] Failed to parse heart likes from localStorage', error);
  }

  return new Set();
};

const persistLikedPaths = (paths: Set<string>) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (paths.size === 0) {
    window.localStorage.removeItem(HEART_STORAGE_KEY);
    return;
  }

  const payload = Array.from(paths);
  window.localStorage.setItem(HEART_STORAGE_KEY, JSON.stringify(payload));
};

const Footer: React.FC = () => {
  const params = useParams();
  const { items } = useStrapiFeed();
  const { hoveredCardId } = useHover();
  const { openCardId, animationPhase, overlayScrollRef } = useOverlay();
  const { theme } = useTheme();
  const location = useLocation();
  const rightText = "COPYRIGHT © HARRY.DS ALL RIGHTS RESERVED.";
  const [isGifVisible, setIsGifVisible] = useState(false);
  const [isGifExiting, setIsGifExiting] = useState(false);
  const [currentGifUrl, setCurrentGifUrl] = useState<string | null>(null);
  const [thankYouMessage, setThankYouMessage] = useState<string | null>(null);
  const [preloadedGifUrl, setPreloadedGifUrl] = useState<string | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const preloadImageRef = useRef<HTMLImageElement | null>(null);
  const preloadedGifCacheRef = useRef<Set<string>>(new Set());
  const [popupKey, setPopupKey] = useState(0);
  const [isHeartLiked, setIsHeartLiked] = useState(false);
  const hasHydratedPreferenceRef = useRef(false);
  const hydratedPageKeyRef = useRef<string | null>(null);
  const pageStorageKey = useMemo(() => normalizePathKey(location.pathname), [location.pathname]);

  const pickRandomGifUrl = useCallback((excludeUrl?: string) => {
    if (GIPHY_URLS.length === 0) {
      return null;
    }

    const filtered = excludeUrl ? GIPHY_URLS.filter((url) => url !== excludeUrl) : GIPHY_URLS;
    const pool = filtered.length > 0 ? filtered : GIPHY_URLS;
    const index = Math.floor(Math.random() * pool.length);

    return pool[index] ?? null;
  }, []);

  const preloadRandomGif = useCallback(
    (excludeUrl?: string) => {
      if (typeof window === 'undefined') {
        return;
      }

      const selected = pickRandomGifUrl(excludeUrl);

      if (!selected) {
        setPreloadedGifUrl(null);
        return;
      }

      const cache = preloadedGifCacheRef.current;

      if (cache.has(selected)) {
        setPreloadedGifUrl(selected);
        return;
      }

      const image = new Image();
      preloadImageRef.current = image;

      image.onload = () => {
        if (preloadImageRef.current === image) {
          cache.add(selected);
          setPreloadedGifUrl(selected);
        }
      };

      image.onerror = () => {
        if (preloadImageRef.current === image) {
          cache.delete(selected);
          setPreloadedGifUrl(selected);
        }
      };

      image.src = selected;
    },
    [pickRandomGifUrl]
  );

  // 決定要監聽的滾動容器：當 overlay 處於 expanding 或 ready 階段時，監聽 overlay 的滾動
  const shouldMonitorOverlay = openCardId && (animationPhase === 'expanding' || animationPhase === 'ready');
  
  // 自動查找 overlay 的滾動容器
  useEffect(() => {
    if (shouldMonitorOverlay) {
      const findOverlayScrollContainer = () => {
        const overlayContent = document.querySelector('.feed-detail-overlay__content') as HTMLDivElement;
        if (overlayContent && overlayScrollRef.current !== overlayContent) {
          overlayScrollRef.current = overlayContent;
        }
      };
      
      // 嘗試立即查找
      findOverlayScrollContainer();
      
      // 如果沒找到，設置一個短暫的輪詢（處理動畫延遲）
      const pollInterval = setInterval(() => {
        if (overlayScrollRef.current) {
          clearInterval(pollInterval);
          return;
        }
        findOverlayScrollContainer();
      }, 50);
      
      // 清理輪詢
      setTimeout(() => clearInterval(pollInterval), 1000);
      
      return () => clearInterval(pollInterval);
    } else {
      // 當不需要監聽 overlay 時，清除 ref
      overlayScrollRef.current = null;
    }
  }, [shouldMonitorOverlay, overlayScrollRef]);
  
  const scrollContainer = shouldMonitorOverlay ? overlayScrollRef.current : null;
  
  const scrollProgress = useScrollProgress({ scrollContainer });

  useEffect(() => {
    if (preloadImageRef.current) {
      preloadImageRef.current.onload = null;
      preloadImageRef.current.onerror = null;
      preloadImageRef.current = null;
    }

    setPreloadedGifUrl(null);
    preloadRandomGif();
  }, [pageStorageKey, preloadRandomGif]);

  const handleHeartClick = useCallback(() => {
    if (isHeartLiked) {
      setIsHeartLiked(false);

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }

      setIsGifVisible(false);
      setIsGifExiting(false);
      setCurrentGifUrl(null);
      setThankYouMessage(null);
      return;
    }

    const gifToDisplay = preloadedGifUrl ?? pickRandomGifUrl();

    if (!gifToDisplay) {
      return;
    }

    setIsHeartLiked(true);

    const messageIndex = Math.floor(Math.random() * THANK_YOU_MESSAGES.length);
    const selectedMessage = THANK_YOU_MESSAGES[messageIndex];

    setCurrentGifUrl(gifToDisplay);
    setThankYouMessage(selectedMessage);
    setIsGifExiting(false);
    setIsGifVisible(true);
    setPopupKey((prev) => prev + 1);

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    hideTimerRef.current = setTimeout(() => {
      setIsGifExiting(true);
      exitTimerRef.current = setTimeout(() => {
        setIsGifVisible(false);
        setIsGifExiting(false);
        setCurrentGifUrl(null);
        setThankYouMessage(null);
        exitTimerRef.current = null;
      }, EXIT_ANIMATION_DURATION_MS);
    }, GIF_DISPLAY_DURATION_MS);
    if (preloadedGifUrl) {
      setPreloadedGifUrl(null);
    }
    preloadRandomGif(gifToDisplay);
  }, [isHeartLiked, pickRandomGifUrl, preloadedGifUrl, preloadRandomGif]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    hasHydratedPreferenceRef.current = false;
    const likedPaths = getStoredLikedPaths();
    const storedLiked = likedPaths.has(pageStorageKey);
    setIsHeartLiked(storedLiked);
    hydratedPageKeyRef.current = pageStorageKey;
    hasHydratedPreferenceRef.current = true;
  }, [pageStorageKey]);

  useEffect(() => {
    if (
      !hasHydratedPreferenceRef.current ||
      typeof window === 'undefined' ||
      hydratedPageKeyRef.current !== pageStorageKey
    ) {
      return;
    }

    const likedPaths = getStoredLikedPaths();
    if (isHeartLiked) {
      likedPaths.add(pageStorageKey);
    } else {
      likedPaths.delete(pageStorageKey);
    }

    persistLikedPaths(likedPaths);
  }, [isHeartLiked, pageStorageKey]);

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    setIsGifVisible(false);
    setIsGifExiting(false);
    setCurrentGifUrl(null);
    setThankYouMessage(null);
  }, [pageStorageKey]);

  useEffect(() => () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
    }
    if (preloadImageRef.current) {
      preloadImageRef.current.onload = null;
      preloadImageRef.current.onerror = null;
      preloadImageRef.current = null;
    }
  }, []);

  // 獲取當前活動卡片的顏色（與 Home 組件相同的邏輯）
  const footerColors = useMemo(() => {
    // 首先檢查 URL 中的打開卡片
    let urlOpenCardId: number | null = null;
    const idParam = params.id;
    const category = params.category as 'article' | 'project' | undefined;
    
    if (idParam && category) {
      const id = Number(idParam);
      if (!isNaN(id)) {
        urlOpenCardId = id;
      }
    }
    
    // 使用打開的卡片或懸停的卡片（與 logo 相同的邏輯）
    // 優先使用 Context 中的 openCardId，如果沒有則使用 URL 中的
    const activeCardId = openCardId || urlOpenCardId || hoveredCardId;
    
    if (activeCardId) {
      const activeItem = items.find((item: FeedItem) => item.id === activeCardId);
      if (activeItem && activeItem.primaryColor && activeItem.secondaryColor) {
        return {
          primaryColor: activeItem.primaryColor,
          secondaryColor: activeItem.secondaryColor,
        };
      }
    }
    
    return {};
  }, [params.id, params.category, hoveredCardId, openCardId, items]);

  // 決定 ScrollIndicator 和 Copyright 的顏色：有 primaryColor 時使用，沒有時使用 CSS 變數
  const displayColor = footerColors.primaryColor || 'var(--hds-sys-color-theme-surface)';
  const displaySecondaryColor = footerColors.secondaryColor || 'var(--on-hds-sys-color-theme-surface)';

  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__left">
          <span
            className="footer__copyright"
            style={{ color: displayColor }}
          >
            {rightText}
          </span>
        </div>
        <div className="footer__right">
          {isGifVisible && currentGifUrl && (
            <div
              key={popupKey}
              className={`footer__giphy-popup ${isGifExiting ? 'footer__giphy-popup--exit' : ''}`}
            >
              <div className="footer__giphy-inner">
                <div
                  className="footer__giphy-image"
                  style={{ backgroundImage: `url(${currentGifUrl})` }}
                  role="img"
                  aria-label="讚賞動畫"
                >
                  {thankYouMessage && (
                    <div className="footer__giphy-overlay">
                      <span className="footer__giphy-message">{thankYouMessage}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <ScrollIndicator 
            scrollProgress={scrollProgress}
            primaryColor={displayColor}
            secondaryColor={displaySecondaryColor}
            scrollContainer={scrollContainer}
            openCardId={openCardId}
            enableScrollToTop={false}
            icon="♥"
            iconAriaLabel="收藏"
            arrowClassName="scroll-indicator__arrow--heart"
            bounceDelayMs={100}
            sliderMultiplier={1}
            onIconClick={handleHeartClick}
            disableProgress={isHeartLiked}
            isLiked={isHeartLiked}
          />
          <ScrollIndicator 
            scrollProgress={scrollProgress}
            primaryColor={displayColor}
            secondaryColor={displaySecondaryColor}
            scrollContainer={scrollContainer}
            openCardId={openCardId}
            bounceDelayMs={0}
            sliderMultiplier={2}
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
