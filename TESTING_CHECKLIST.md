# Experimental UI Testing Checklist

## Quick Test (5 minutes)
- [ ] Open http://localhost:5000/index-experimental.html
- [ ] Click theme toggle (should switch light/dark)
- [ ] Click drop zone → Select image
- [ ] Image should replace drop zone (not appear below)
- [ ] Click "Process with AI" button
- [ ] Verify form fields populated
- [ ] Click "Add to Calendar" → Select Google
- [ ] Should open Google Calendar with event

## Full Test (15 minutes)

### Upload Methods
- [ ] Click to upload image
- [ ] Drag and drop image
- [ ] Paste image from clipboard (Ctrl+V)

### Image Validation
- [ ] Upload 11MB image (should reject)
- [ ] Upload GIF file (should reject)
- [ ] Upload valid JPG (should accept)
- [ ] Upload valid PNG (should accept)

### Processing
- [ ] Processing screen shows with animation
- [ ] QR code detection (if present in image)
- [ ] Image enhancement applied
- [ ] AI extraction completes
- [ ] Switches to verification screen

### Form Verification
- [ ] Title field populated
- [ ] Start time populated
- [ ] End time populated
- [ ] Location populated
- [ ] Description populated
- [ ] Confidence indicator shows
- [ ] Can edit all fields

### Recurring Events (if detected)
- [ ] Recurring section visible
- [ ] Checkbox checked
- [ ] Frequency dropdown set
- [ ] Pattern field populated
- [ ] Can toggle checkbox
- [ ] Options hide/show correctly

### Calendar Export
- [ ] Click "Add to Calendar"
- [ ] Modal appears with 3 options
- [ ] Google Calendar opens in new tab
- [ ] Apple Calendar downloads .ics file
- [ ] Outlook Calendar opens in new tab
- [ ] Success modal appears
- [ ] Can close modal
- [ ] Preference saved (check modal again)

### Navigation
- [ ] Click "Back" from verification screen
- [ ] Returns to upload screen
- [ ] Image still visible in preview
- [ ] Click "Retake" button
- [ ] Drop zone appears again
- [ ] Preview hidden

### Theme Toggle
- [ ] Light mode → Dark mode transition smooth
- [ ] Dark mode → Light mode transition smooth
- [ ] Icons switch (sun ↔ moon)
- [ ] Refresh page → Theme persists

### Toast Notifications
- [ ] Success toast appears (green with ✓)
- [ ] Error toast appears (red with ✗)
- [ ] Warning toast appears (yellow with ⚠)
- [ ] Auto-dismiss after 4 seconds
- [ ] Retry button shows on error with image

### Mobile Testing (if available)
- [ ] Touch interactions work
- [ ] Haptic feedback on actions
- [ ] Responsive layout looks good
- [ ] Camera capture option available
- [ ] Pinch to zoom disabled on inputs

### Visual Effects
- [ ] Animated gradient background
- [ ] Particles network visible
- [ ] Glass morphism effect on cards
- [ ] 3D hover effect on cards
- [ ] Neon glow on text
- [ ] Smooth animations throughout
- [ ] Holographic text gradient

### Error Scenarios
- [ ] Upload non-event image → Proper error message
- [ ] Network disconnect → Network error
- [ ] Invalid date in form → Validation error
- [ ] Process with no image → Error toast

### Edge Cases
- [ ] Very long event title (should wrap)
- [ ] Very long description (should wrap in textarea)
- [ ] Event with no location (should allow empty)
- [ ] Event with no description (should allow empty)
- [ ] Multi-day recurring (Mon, Wed, Fri)
- [ ] Daily recurring event
- [ ] Yearly recurring event

### Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile Chrome (if available)
- [ ] Mobile Safari (if available)

## Bug Report Template

If you find any issues:

```
**Issue**: [Brief description]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Browser**: [Browser name and version]
**Console Errors**: [Any errors in browser console]
**Screenshots**: [If applicable]
```

## Performance Check
- [ ] First load < 3 seconds
- [ ] Theme switch instant (< 100ms)
- [ ] AI processing < 10 seconds
- [ ] Calendar export < 1 second
- [ ] Animations smooth (60fps)
- [ ] No layout shift
- [ ] No console errors
- [ ] No console warnings

## Accessibility Check
- [ ] Tab navigation works
- [ ] Focus states visible
- [ ] Screen reader friendly
- [ ] Color contrast sufficient
- [ ] Text readable at 200% zoom
- [ ] No keyboard traps

## Success Criteria
✅ All Quick Test items pass
✅ All Form Verification items pass
✅ All Calendar Export items pass
✅ No critical bugs found
✅ Performance acceptable
✅ Visual effects working

## Report Results
Once testing complete, document results in GitHub issues or share with team.

---

**Testing URL**: http://localhost:5000/index-experimental.html
**Production URL**: https://event-snap.web.app (for comparison)
**Last Updated**: November 7, 2025
